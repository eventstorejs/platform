import { injectable } from 'inversify'
import { writeFile, readFile } from 'fs-extra'
import { internal } from 'boom'
import { join } from 'path'
import { dir } from 'tmp'
import { merge } from 'lodash'
import { spawn } from 'child_process'
import '@eventstorejs/latex-binary'
import { Config } from '@eventstorejs/core'
import { StorageService, ExternalResource } from '@eventstorejs/storage'
import { logger } from '@eventstorejs/request'

const log = logger('pdf')

export interface PdfRequestOptions {
  clean?: boolean,
  externalResources?: Array<ExternalResource>
}

@injectable()
export class PdfService {

  constructor (_config: Config, private storage: StorageService) {
    //
  }

  async process (template: string, pdfOptions: PdfRequestOptions = {}): Promise<string | PdfResult> {
    log.info(`Staring templating process`)
    const options = merge({}, {
      clean: true
    }, pdfOptions)
    const temp = await this._createTempDir()
    log.debug(`Created tmp directory: ${temp.path}`)
    const indexPath = join(temp.path, 'index.tex')
    const resultPath = join(temp.path, 'index.pdf')
    log.debug(`Processing input ${indexPath}`)
    await writeFile(indexPath, template, { encoding: 'utf-8' })
    log.debug(`index.tex succesfully written for processing.`)
    if (options.externalResources && options.externalResources.length > 0) {
      log.debug(`Have externalResources. Loading first`)
      for (const r of options.externalResources) {
        await this.storage.download({
          bucket: r.bucket,
          key: r.path,
          localFile: join(temp.path, r.saveAs),
          encoding: r.encoding
        })
      }
    }

    log.debug(`Preparation completed. Running pdflatex`)
    await this._execute(indexPath, temp.path)
    log.debug(`pdflatex completed`)
    if (!options.clean) {
      log.info(`Autoclean disabled`)
      log.info(`Pdf Saved as ${resultPath}`)
      return {
        indexPath,
        resultPath,
        clean: temp.clean
      }
    } else {
      log.info(`Clean false. Reading file and cleaning up`)
      const result = await readFile(resultPath)
      temp.clean()
      log.debug(`Tmp directory cleaned`)
      return result.toString('utf-8')
    }
  }

  async _createTempDir (): Promise<{ path: string, clean: Function }> {
    return new Promise<{ path: string, clean: Function }>((resolve, reject) => {
      dir({ unsafeCleanup: true }, (err: Error, path: string, clean: Function) => {
        if (err) {
          return reject(err)
        }
        resolve({ path, clean })
      })
    })
  }

  async _execute (texFile: string, cwd: string, runs: number = 2) {
    const binaryPath = join(process.cwd(), 'node_modules', '@eventstorejs', 'latex-binary', 'vendor', 'bin', 'x86_64-linux', `pdflatex`)
    const processArguments = ['--interaction=nonstopmode', `-output-directory=${texFile.slice(0, -9)}`, texFile]
    for (let i = 1; i <= runs; i++) {
      log.debug(`Doing pdflatex run ${i} of ${runs}`)

      await (new Promise((resolve, reject) => {
        const run = spawn(binaryPath, processArguments, {
          cwd
        })
        run.stdout.on('data', (_data) => {
          // log.debug((data as Buffer).toString('utf-8'))
        })
        run.stderr.on('data', (data) => {
          log.warn((data as Buffer).toString('utf-8'))
        })
        run.on('close', (code) => {
          if (code > 0) {
            log.error(`Latex creation failed`)
            return reject(internal(`Latex exited with ${code}`))
          }
          log.debug(`Run ${i} of ${runs} completed`)
          resolve()
        })
      }))
    }
  }

}

export interface PdfResult {
  indexPath: string
  resultPath: string
  clean: Function
}
