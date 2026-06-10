// ─── OmniDispatch Infrastructure-as-Code ───
// Provisions all Azure resources required for the agent service.
// Deploy via: az deployment group create --template-file infra/main.bicep

targetScope = 'resourceGroup'

@description('Base name for all resources')
param baseName string = 'omnidispatch'

@description('Azure region for deployment')
param location string = resourceGroup().location

@description('Azure OpenAI model deployment name')
param openAiModelDeployment string = 'gpt-4o-mini'

// ─── Azure OpenAI Service ───
resource openAi 'Microsoft.CognitiveServices/accounts@2024-04-01-preview' = {
  name: '${baseName}-openai'
  location: location
  kind: 'OpenAI'
  sku: { name: 'S0' }
  properties: {
    customSubDomainName: '${baseName}-openai'
    publicNetworkAccess: 'Enabled'
  }
}

resource openAiDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-04-01-preview' = {
  parent: openAi
  name: openAiModelDeployment
  sku: {
    name: 'Standard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o-mini'
      version: '2024-07-18'
    }
  }
}

// ─── Azure AI Search ───
resource search 'Microsoft.Search/searchServices@2024-03-01-preview' = {
  name: '${baseName}-search'
  location: location
  sku: { name: 'basic' }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    semanticSearch: 'standard'
  }
}

// ─── Azure Application Insights (OpenTelemetry) ───
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${baseName}-logs'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${baseName}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ─── Azure Container Apps Environment ───
resource containerEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${baseName}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ─── Agent Service Container App ───
resource agentApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${baseName}-agent'
  location: location
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8088
        transport: 'http'
      }
    }
    template: {
      containers: [
        {
          name: 'agent'
          image: 'PLACEHOLDER' // Replaced by azd deploy
          resources: {
            cpu: json('2.0')
            memory: '4Gi'
          }
          env: [
            { name: 'AZURE_OPENAI_ENDPOINT', value: openAi.properties.endpoint }
            { name: 'AZURE_OPENAI_DEPLOYMENT', value: openAiModelDeployment }
            { name: 'AZURE_SEARCH_ENDPOINT', value: 'https://${search.name}.search.windows.net' }
            { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 3
      }
    }
  }
}

// ─── Outputs ───
output agentServiceUrl string = 'https://${agentApp.properties.configuration.ingress.fqdn}'
output openAiEndpoint string = openAi.properties.endpoint
output searchEndpoint string = 'https://${search.name}.search.windows.net'
output appInsightsKey string = appInsights.properties.InstrumentationKey
