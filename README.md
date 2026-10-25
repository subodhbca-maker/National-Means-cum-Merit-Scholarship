# Basic Pathshala - NMMS

उत्तर प्रदेश NMMS (राष्ट्रीय आय एवं योग्यता आधारित छात्रवृत्ति परीक्षा) की तैयारी के लिए software। यह पेपर बनाता है, प्रश्न बैंक संभालता है, PPT और Google Form बनाता है, OMR शीट प्रिंट और मोबाइल कैमरे से स्कैन करता है, ऑनलाइन मॉक टेस्ट लेता है और रैंक सूची बनाता है।

A browser app for UP NMMS: paper generator (40% easy / 40% moderate / 20% hard), question bank with UP previous-year questions, PowerPoint and Google Form export, OMR print and camera scan, mock tests and merit lists. It runs fully offline. Gemini AI is optional and is used only to import scanned PDFs and to write new questions.

## कैसे चलाएँ / How to run

- **सबसे आसान:** पूरा folder डाउनलोड करें और `index.html` पर double-click करें (Chrome या Edge)। Install करने की ज़रूरत नहीं है।
- **Online / मोबाइल:** GitHub Pages पर चालू करें (Settings → Pages → Branch चुनें)। फिर मोबाइल पर link खोलें और "Add to Home screen" दबाएँ। ऐप offline भी चलता है।
- सारा डेटा उसी ब्राउज़र में रहता है। Settings में जाकर बैकअप (.json) लें और किसी दूसरे कंप्यूटर पर restore करें।

## मुख्य सुविधाएँ / Features

| सुविधा | विवरण |
|---|---|
| पेपर generator | UP पैटर्न: MAT 90 (Q1–90) · SAT 90 (Q91–180: विज्ञान 35, सामाजिक अध्ययन 35, गणित 20) · पूरा 180 · कस्टम। कठिनाई अनुपात अपने-आप 40/40/20 रहता है और बदला भी जा सकता है। |
| प्रश्न बैंक | UP NMMS 2023, 2024, 2025 के 422 PYQ (उत्तर सहित), 95 मूल विज्ञान/सामाजिक प्रश्न, और MAT के 16 व गणित के 17 प्रकार के generator, जिनसे असीमित नए प्रश्न बनते हैं। सारे प्रश्न हिंदी + English में हैं। |
| भाषा | हर पेपर/PPT/Form के लिए: हिंदी + English, केवल हिंदी, या English only |
| प्रश्न पत्र PDF | UP बुकलेट जैसा (बाएँ हिंदी, दाएँ English), उत्तर कुंजी और व्याख्या सहित |
| PowerPoint | हर प्रश्न की एक स्लाइड, उसके बाद उत्तर-स्लाइड (सही विकल्प हरा, व्याख्या सहित) |
| Google Form | Quiz form का Apps Script code (answer key, 1 अंक/प्रश्न, नाम/अनुक्रमांक के खाने सहित) |
| कोई भी PDF → PPT + Form | किसी भी परीक्षा का PDF या फ़ोटो डालें। Gemini प्रश्न निकालता है, अनुवाद करता है, उत्तर और कठिनाई तय करता है। फिर पेपर "जैसा है" बनाएँ या 40/40/20 में संतुलित करें। चित्र वाले प्रश्नों के लिए PDF पेज से चित्र काटकर जोड़ सकते हैं। |
| OMR | UP प्रारूप की 180 प्रश्नों वाली शीट (7 अंकों का अनुक्रमांक)। मोबाइल फ़ोटो से अपने-आप जाँच होती है और शिक्षक हर उत्तर देखकर सुधार सकता है। |
| मॉक टेस्ट | टाइमर, प्रश्न-palette, "बाद में देखें", तुरंत परिणाम और हर उत्तर की व्याख्या |
| परिणाम | विषयवार अंक, रैंक, 40% क्वालिफ़ाइंग गिनती। मेरिट सूची Excel और PDF में सीधे डाउनलोड (पेपर पेज के "परिणाम / रैंक" कार्ड से भी) |

## Gemini AI (वैकल्पिक / optional)

1. https://aistudio.google.com/apikey खोलें और Google account से login करें। "Create API key" दबाएँ।
2. ऐप में **Settings → Google Gemini AI** में key paste करें → Save → "जाँचें"।
3. Key सिर्फ़ आपके ब्राउज़र में रहती है और बैकअप फ़ाइल में नहीं जाती।

## Google Form कैसे बनता है

पेपर पेज → **Google Form (Quiz)** → code copy करें → https://script.google.com पर New project खोलें → code paste करें → `createNmmsForm` चुनकर ▶ Run दबाएँ → permission दें। Execution log में form का link आ जाएगा।

## OMR स्कैन के सुझाव

- प्रिंट A4 पर, **Scale 100%** पर करें। चारों कोनों के काले निशान और ऊपर-बाईं ओर की पट्टी ही स्कैन का आधार हैं।
- गोले काले या नीले बॉल पेन से पूरे भरें। फ़ोटो ऊपर से सीधी लें, शीट समतल रखें और चारों कोने फ्रेम में हों।
- टेढ़ी (±6°), छाया वाली और उल्टी पकड़ी गई फ़ोटो पर परीक्षण किया गया: 180/180 उत्तर और अनुक्रमांक सही पढ़े गए।

## फ़ाइलें / Project layout

```
index.html            app shell
css/app.css           styles (desktop + mobile)
js/util.js, db.js     helpers, IndexedDB storage
js/generators.js      bilingual MAT + Maths question generators
js/paper.js           UP patterns, 40/40/20 paper builder, scoring
js/exporters.js       print booklet / answer key, PPT (PptxGenJS), Google Form script, Excel
js/omr.js             OMR sheet drawing + camera scan (marker detection, homography)
js/ai.js              Gemini (PDF/image extraction, question generation) + offline text parser
js/pages-*.js, app.js screens and router
data/pyq-up-*.js      UP NMMS 2023/2024/2025 questions (answers worked out)
data/sat-bank.js      practice questions for Science & Social Studies
lib/                  pdf.js, PptxGenJS, SheetJS, jsPDF, html2canvas (bundled for offline use)
```

PYQ नोट: प्रश्न-पुस्तिकाओं में आधिकारिक उत्तर कुंजी नहीं थी, इसलिए हर उत्तर हल करके डाला गया है। चित्र-आधारित प्रश्न और जिनका कोई एक पक्का उत्तर नहीं बनता, वे छोड़ दिए गए हैं। इन्हें आप Import में PDF से काटकर जोड़ सकते हैं।

## Windows ऐप (.exe)

`desktop/` folder में Windows desktop version का source है (Electron)। Installer बनाने के लिए:

```
cd desktop
npm install
npm run build:win     # needs `makensis` (NSIS) and `zip`
```

Output `desktop/out/` में:
- `BasicPathshala-NMMS-Setup-<version>.exe`: installer। Admin rights नहीं चाहिए; Desktop और Start Menu shortcut बनाता है।
- `BasicPathshala-NMMS-Portable-<version>.zip`: बिना install किए चलाने के लिए।

Desktop ऐप का डेटा `%APPDATA%\Basic Pathshala NMMS` में रहता है। Uninstall करने पर भी यह डेटा रहता है। एक कंप्यूटर से दूसरे पर ले जाने के लिए Settings → बैकअप इस्तेमाल करें।
