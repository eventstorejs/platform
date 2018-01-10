
import '@eventstorejs/request'
import { graphql, GraphQLSchema } from 'graphql'
import { inject } from 'inversify'
import { weaveSchemas } from 'graphql-weaver'
import { tryStringifyJson } from '@eventstorejs/core'
import { handler, RequestHandler, Context, HttpResponse } from '@eventstorejs/request'
import { IdentityModule } from '@eventstorejs/identity'
import { EventStoreModule } from '@eventstorejs/eventstore'
import { GraphQLEndpointResolver } from '../../lib'

let schema: Promise<GraphQLSchema>

const schemaFactory = (endpointResolver: GraphQLEndpointResolver) => {
  if (!schema) {
    schema = new Promise<GraphQLSchema>(async (resolve, reject) => {
      try {
        const endpoints = await endpointResolver.resolve()
        resolve(weaveSchemas({
          endpoints
        }))
      } catch (e) {
        reject(e)
      }
    })
  }
  return schema
}

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

  constructor( @inject(GraphQLEndpointResolver) private endpointResolver: GraphQLEndpointResolver) {

  }

  async handle (request: any, _context: Context): Promise<HttpResponse> {
    const schema = await schemaFactory(this.endpointResolver)

    const res = await graphql(schema, request.query, {}, {}, request.variables)
    return {
      statusCode: 200,
      body: tryStringifyJson(res)
    }
  }

}
