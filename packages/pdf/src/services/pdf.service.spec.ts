import 'jest'
import 'reflect-metadata'
import { Mock } from 'typemoq'
import * as fs from 'fs'
import { Config } from '@eventstorejs/core'
import { PdfService } from './pdf.service'

// node_modules/@eventstorejs/latex-binary/vendor/bin/x86_64-linux/pdflatex --interaction=nonstopmode --output-directory=/tmp/tmp-26639pMNgwHZy5Oil/ --shell-escape /tmp/tmp-26639pMNgwHZy5Oil/index.tex

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

test('create pdf', async () => {
  let config = Mock.ofType(Config)

  let pdf = new PdfService(config.object, null as any)
  let res = await pdf.process(`\
\\documentclass[landscape]{article}
\\usepackage{tabularx}
\\usepackage{geometry}
\\usepackage{longtable}
\\usepackage{fancyhdr}
\\usepackage[utf8]{inputenc}
\\geometry{a4paper,  total={170mm,257mm},  left=15mm,  right= 25mm,  top=20mm,  bottom=20mm,  headheight=6mm}
%header
\\pagestyle{fancy}

\\begin{document}
Hello World
\\end{document}`)
  try {
    fs.mkdirSync('.tmp')
  } catch (e) {
    // dir exists already
  }
  fs.writeFileSync(`.tmp/create-pdf-test${Date.now()}.pdf`, res)
})
