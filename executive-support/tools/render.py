"""Export the six-page print edition and the fixed social preview.

Run build.py first. Requires weasyprint and pymupdf.
"""
from pathlib import Path
import logging
import json
from weasyprint import HTML
import fitz

logging.getLogger('weasyprint').setLevel(logging.ERROR)
ROOT = Path(__file__).resolve().parents[1]
HTML(filename=ROOT/'index.html').write_pdf(ROOT/'hatta-executive-support.pdf')
doc = fitz.open(ROOT/'hatta-executive-support.pdf')
if len(doc) != 6:
    raise ValueError(f'Expected six pages, got {len(doc)}')
print(f'PDF: {len(doc)} A4 pages, {(ROOT/"hatta-executive-support.pdf").stat().st_size:,} bytes')

social = '''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{font-family:Serif;src:url('../assets/hatta/fonts/serif-bold.woff2');font-weight:700}
@font-face{font-family:Serif;src:url('assets/serif-black.woff2');font-weight:900}
@font-face{font-family:Sans;src:url('../assets/hatta/fonts/sans-regular.woff2');font-weight:400}
@font-face{font-family:Sans;src:url('../assets/hatta/fonts/sans-medium.woff2');font-weight:500}
@page{size:1200px 630px;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;width:1200px;height:630px;background:#061f56;color:#fbfaf7;font:400 26px/1.7 Sans;direction:rtl}
.canvas{position:relative;width:1200px;height:630px;padding:58px 65px;overflow:hidden}.frame-a,.frame-b{position:absolute;width:100px;height:100px}.frame-a{top:25px;right:25px;border-top:2px solid #b47a2d;border-right:2px solid #b47a2d}.frame-b{bottom:25px;left:25px;border-bottom:2px solid #b47a2d;border-left:2px solid #b47a2d}
.copy{position:absolute;right:70px;top:65px;width:680px}.kicker{color:#d2a05a;font-size:23px;letter-spacing:0}h1{font-family:Serif;font-weight:900;font-size:83px;font-feature-settings:"salt" 1;line-height:1.42;margin:21px 0 21px}p{font-size:27px;line-height:1.7;margin:0;color:#e6d2ae}.author{font-size:21px;color:#b8c4d8;margin-top:24px}
.brand{position:absolute;left:64px;top:58px;background:#fbfaf7;width:240px;height:101px;overflow:hidden}.brand img{position:absolute;max-width:none;width:300px;right:-28px;top:-36px}
.diagram{position:absolute;left:65px;top:222px;width:253px}.node{position:relative;padding:16px 24px;border:1px solid #6a7b9a;line-height:1.5;color:#fbfaf7;font-size:25px;margin-bottom:28px}.node:after{content:"";position:absolute;right:50%;bottom:-29px;height:28px;border-right:1px solid #b47a2d}.node:last-child:after{display:none}.node.feature{background:#d2a05a;border-color:#d2a05a;color:#061f56}.node b{font-feature-settings:"salt" 1;font-weight:500}.node span{display:block;font-size:15px;margin-top:5px;color:#c0cde1}.node.feature span{color:#233859}
</style></head><body><div class="canvas"><div class="frame-a"></div><div class="frame-b"></div><div class="copy"><div class="kicker">مقترح خدمات</div><h1>المساعدة<br>الإدارية والتنفيذية</h1><p>لتطوير الأعمال والاستشارات</p><div class="author">إعداد بانا العقاد</div></div><div class="brand"><img src="../assets/hatta/logo.webp"></div><div class="diagram"><div class="node"><b>تحليل وتوصيات</b><span>استشارات وذكاء اصطناعي</span></div><div class="node feature"><b>تنظيم وتنفيذ</b><span>خطط عمل ومهام</span></div><div class="node"><b>متابعة وإنجاز</b><span>تواصل وتقارير</span></div></div></div></body></html>'''
image_pdf = HTML(string=social, base_url=str(ROOT)+'/').write_pdf()
image_doc = fitz.open(stream=image_pdf, filetype='pdf')
if len(image_doc) != 1:
    raise ValueError('Social preview must be a single canvas')
pix = image_doc[0].get_pixmap(matrix=fitz.Matrix(4/3,4/3), alpha=False)
if (pix.width,pix.height) != (1200,630):
    raise ValueError(f'Unexpected preview size: {pix.width}x{pix.height}')
pix.save(ROOT/'assets/share-v1.png')
print('Social preview: 1200 x 630 pixels')
