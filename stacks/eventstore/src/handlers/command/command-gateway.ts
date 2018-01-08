import '@eventstorejs/request'
import { inject } from 'inversify'
import { tryStringifyJson } from '@eventstorejs/core'
import { handler, RequestHandler, Context, HttpResponse } from '@eventstorejs/request'
import { EventStoreModule, CommandService } from '@eventstorejs/eventstore'
import { IdentityModule } from '@eventstorejs/identity'

// const log = logger('Garage.command-handler')

@handler({
  name: 'command-gateway',
  timeout: 30,
  events: [{
    http: {
      method: 'POST',
      // request: `JSON{"template": {"'application/json'": "{  'body' : $input.body,  'headers': {    #foreach($header in $input.params().header.keySet())    '$header': '$util.escapeJavaScript($input.params().header.get($header))' #if($foreach.hasNext),#end    #end  },  'method': '$context.httpMethod',  'params': {    #foreach($param in $input.params().path.keySet())    '$param': '$util.escapeJavaScript($input.params().path.get($param))' #if($foreach.hasNext),#end    #end  },  'query': {    #foreach($queryParam in $input.params().querystring.keySet())    '$queryParam': '$util.escapeJavaScript($input.params().querystring.get($queryParam))' #if($foreach.hasNext),#end    #end  }}"  }}`,
      response: `JSON{  "headers": {    "Content-Type": "'application/json'"  },  "template": "$input.path('$')",  "statusCodes": {    "200": {      "pattern": "",      "template": "$input.path(\\"$.body\\")"    },    "400": {      "pattern": ".*\\"statusCode\\":400,.*",      "template": "$input.path('$.errorMessage')"    },    "401": {      "pattern": ".*\\"statusCode\\":401,.*",      "template": "$input.path('$.errorMessage')"    },    "403": {      "pattern": ".*\\"statusCode\\":403,.*",      "template": "$input.path('$.errorMessage')"    },    "404": {      "pattern": ".*\\"statusCode\\":404,.*",      "template": "$input.path('$.errorMessage')"    },    "500": {      "pattern": ".*\\"statusCode\\":500,.*",      "template": "$input.path('$.errorMessage')"    }  }}`,
      path: 'command',
      integration: 'lambda',
      cors: true
    }
  }],
  imports: [EventStoreModule, IdentityModule]
})
export default class CommandGatewayHandler implements RequestHandler<any> {

  constructor ( @inject(CommandService) private command: CommandService) {

  }

  async handle (event: any, context: Context): Promise<HttpResponse> {
    const res = await this.command.handle(event, context.identity)
    return {
      statusCode: res && res.statusCode ? res.statusCode : 200,
      body: res && res.body ? tryStringifyJson(res.body) : undefined
    }
  }

}
