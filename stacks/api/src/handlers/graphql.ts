
import '@eventstorejs/request'
import { graphql } from 'graphql'
import { weaveSchemas } from 'graphql-weaver'
import { tryStringifyJson } from '@eventstorejs/core'
import { handler, RequestHandler, Context, HttpResponse } from '@eventstorejs/request'
import { IdentityModule } from '@eventstorejs/identity'
import { EventStoreModule } from '@eventstorejs/eventstore'

const makeSchema = weaveSchemas({
  endpoints: [{
    namespace: 'training',
    typePrefix: 'Training',
    url: 'https://api.graph.cool/simple/v1/cjaqvnvuf2rfx0121q6tlk4bw' // url to a GraphQL endpoint
  }]
})

// const log = logger('Garage.command-handler')

@handler({
  name: 'graphql-gateway',
  timeout: 30,
  events: [{
    http: {
      method: 'POST',
      // request: `JSON{"template": {"'application/json'": "{  'body' : $input.body,  'headers': {    #foreach($header in $input.params().header.keySet())    '$header': '$util.escapeJavaScript($input.params().header.get($header))' #if($foreach.hasNext),#end    #end  },  'method': '$context.httpMethod',  'params': {    #foreach($param in $input.params().path.keySet())    '$param': '$util.escapeJavaScript($input.params().path.get($param))' #if($foreach.hasNext),#end    #end  },  'query': {    #foreach($queryParam in $input.params().querystring.keySet())    '$queryParam': '$util.escapeJavaScript($input.params().querystring.get($queryParam))' #if($foreach.hasNext),#end    #end  }}"  }}`,
      response: `JSON{  "headers": {    "Content-Type": "'application/json'"  },  "template": "$input.path('$')",  "statusCodes": {    "200": {      "pattern": "",      "template": "$input.path(\\"$.body\\")"    },    "400": {      "pattern": ".*\\"statusCode\\":400,.*",      "template": "$input.path('$.errorMessage')"    },    "401": {      "pattern": ".*\\"statusCode\\":401,.*",      "template": "$input.path('$.errorMessage')"    },    "403": {      "pattern": ".*\\"statusCode\\":403,.*",      "template": "$input.path('$.errorMessage')"    },    "404": {      "pattern": ".*\\"statusCode\\":404,.*",      "template": "$input.path('$.errorMessage')"    },    "500": {      "pattern": ".*\\"statusCode\\":500,.*",      "template": "$input.path('$.errorMessage')"    }  }}`,
      path: 'graphql',
      integration: 'lambda',
      cors: true
    }
  }],
  imports: [EventStoreModule, IdentityModule]
})
export default class GraphqlGatewayHandler implements RequestHandler<any> {

  constructor () {

  }

  async handle (request: any, _context: Context): Promise<HttpResponse> {
    let schema = await makeSchema

    let res = await graphql(schema, request.query, {}, {}, request.variables)
    return {
      statusCode: 200,
      body: tryStringifyJson(res)
    }
  }

}
