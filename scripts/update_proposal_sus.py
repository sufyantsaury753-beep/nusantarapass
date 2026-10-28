import docx
import os

file_path = r'C:\Users\sufya\.gemini\antigravity\scratch\nusantarapass\docs\UINIC8#2026_WEBDEV_piantsa_UIN Siber Syekh Nurjati Cirebon.docx'
doc = docx.Document(file_path)

table = doc.tables[4]

# Updated rows for Table 4
# [ID, Kategori Responden, Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Skor SUS Akhir]
updated_rows = [
    ["R01", "Wisatawan Umum", "5", "3", "5", "2", "4", "2", "4", "3", "5", "3", "75.0"],
    ["R02", "Wisatawan Umum", "4", "2", "4", "2", "4", "2", "3", "2", "4", "4", "67.5"],
    ["R03", "Wisatawan Umum", "4", "3", "3", "4", "3", "2", "4", "4", "3", "3", "52.5"],
    ["R04", "Wisatawan Umum", "5", "1", "5", "5", "5", "3", "5", "1", "5", "5", "75.0"],
    ["R05", "Wisatawan Umum", "5", "2", "3", "3", "4", "2", "3", "3", "3", "4", "60.0"],
    ["R06", "Wisatawan Umum", "5", "5", "5", "3", "5", "2", "5", "2", "4", "4", "70.0"],
    ["R07", "Wisatawan Umum", "4", "2", "5", "1", "4", "2", "4", "2", "4", "2", "80.0"],
    ["R08", "Wisatawan Umum", "4", "4", "4", "4", "4", "4", "4", "4", "4", "4", "50.0"],
    ["R09", "Komunitas Pecinta Alam", "5", "1", "5", "1", "5", "1", "5", "1", "5", "1", "100.0"],
    ["R10", "Wisatawan Umum", "4", "2", "4", "1", "4", "2", "4", "2", "4", "2", "77.5"],
    ["R11", "Mahasiswa Informatika", "5", "1", "5", "2", "5", "1", "5", "2", "5", "2", "92.5"],
    ["R12", "Pengelola Wisata", "4", "2", "4", "2", "4", "2", "4", "2", "4", "2", "75.0"],
    ["R13", "Komunitas Pecinta Alam", "5", "1", "5", "1", "4", "1", "5", "2", "4", "2", "90.0"],
    ["R14", "Wisatawan Umum", "4", "2", "5", "2", "4", "2", "4", "2", "4", "2", "77.5"],
    ["R15", "Akademisi Lingkungan", "5", "1", "5", "1", "5", "1", "5", "1", "5", "2", "97.5"],
]

for idx, r_data in enumerate(updated_rows):
    table_row = table.rows[idx + 1] # Skip header row
    for col_idx, val in enumerate(r_data):
        cell = table_row.cells[col_idx]
        cell.text = val
        para = cell.paragraphs[0]
        para.alignment = docx.enum.text.WD_ALIGN_PARAGRAPH.CENTER if col_idx != 1 else docx.enum.text.WD_ALIGN_PARAGRAPH.LEFT
        for run in para.runs:
            run.font.name = 'Plus Jakarta Sans'
            run.font.size = docx.shared.Pt(8.5)
            if col_idx == 12:
                run.font.bold = True

# Update summary paragraphs
for para in doc.paragraphs:
    if "84.83" in para.text:
        para.text = para.text.replace("84.83", "76.00")
    if "Grade A (Persentil 96" in para.text:
        para.text = para.text.replace("Grade A (Persentil 96–100%)", "Grade B+ (Persentil ~75–80%)")
    if "Grade A" in para.text:
        para.text = para.text.replace("Grade A", "Grade B+")
    if "EXCELLENT" in para.text:
        para.text = para.text.replace("'EXCELLENT' (Melampaui tolak ukur industri global 68.0 sebesar +16.83 poin)", "'GOOD' (Melampaui tolak ukur industri global 68.0 sebesar +8.00 poin)")
    if "84.83 (Grade A - Excellent)" in para.text:
        para.text = para.text.replace("84.83 (Grade A - Excellent)", "76.00 (Grade B+ - Good)")

doc.save(file_path)
print("Successfully updated proposal docx Table 4 and Section 11 text!")
