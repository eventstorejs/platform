import * as cuid from 'cuid'
import { extname } from 'path'

export function latexImage (options: any): string | undefined {
  let fileName = `${cuid().toString()}${extname(options.hash.path)}`
  options.data.root.__externalResources.push({
    bucket: options.hash.bucket,
    path: options.hash.path,
    saveAs: fileName,
    encoding: options.hash.encoding
  })

  return fileName
}
