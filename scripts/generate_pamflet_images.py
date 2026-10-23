import os, subprocess, shutil, pymupdf

root = r'C:\Users\sufya\.gemini\antigravity\scratch\nusantarapass'
pamflet_html = os.path.join(root, 'pamflet', 'index.html').replace('\\', '/')
out_pdf = os.path.join(root, 'pamflet', 'output.pdf')
out_dir = os.path.join(root, 'pamflet', 'output')
docs_pamflet_dir = os.path.join(root, 'docs', 'pamflet')

os.makedirs(out_dir, exist_ok=True)
os.makedirs(docs_pamflet_dir, exist_ok=True)

edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

cmd = [
    edge,
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    f'--print-to-pdf={out_pdf}',
    f'file:///{pamflet_html}'
]
print('Exporting slides with Edge headless...')
res = subprocess.run(cmd, capture_output=True, text=True)
print('Edge returncode:', res.returncode)

slide_names = [
    'slide-1-eksplorasi-webgis.png',
    'slide-2-fitur-utama-ekosistem.png',
    'slide-3-paspor-digital-buffer.png',
    'slide-4-konsol-admin-cms-rls.png',
    'slide-5-arsitektur-dan-sdgs.png'
]

if os.path.exists(out_pdf):
    doc = pymupdf.open(out_pdf)
    print(f'PDF generated with {len(doc)} pages.')
    for i, page in enumerate(doc):
        # Render page to PNG at 150 DPI (super crisp high-resolution 1275x1650 / 4:5 ratio)
        pix = page.get_pixmap(dpi=150)
        img_filename = slide_names[i] if i < len(slide_names) else f'slide-{i+1}.png'
        
        path1 = os.path.join(out_dir, img_filename)
        path_num = os.path.join(out_dir, f'slide-{i+1}.png')
        path_docs = os.path.join(docs_pamflet_dir, img_filename)
        
        pix.save(path1)
        pix.save(path_num)
        shutil.copyfile(path1, path_docs)
        print(f'Rendered Slide {i+1}: {img_filename} ({pix.width}x{pix.height})')
        
    print('ALL SLIDES SUCCESSFULLY EXPORTED TO:')
    print(f' - {out_dir}')
    print(f' - {docs_pamflet_dir}')
else:
    print('Error: PDF not found.')
