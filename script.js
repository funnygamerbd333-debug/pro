const tabDescriptions = {
  pdfWord: "Convert PDF files to Word (.docx) directly in browser.",
  wordPdf: "Word → PDF conversion not supported in browser.",
  pdfJpg: "Convert PDF pages to JPG images.",
  jpgPdf: "Convert JPG images to a single PDF file."
};

function openTab(evt, tabName){
  const tabcontent = document.getElementsByClassName("tabcontent");
  for(let i=0;i<tabcontent.length;i++){ tabcontent[i].style.display="none"; }
  const tablinks = document.getElementsByClassName("tablinks");
  for(let i=0;i<tablinks.length;i++){ tablinks[i].classList.remove("active"); }
  document.getElementById(tabName).style.display="block";
  evt.currentTarget.classList.add("active");
  document.getElementById("tabDesc").innerText = tabDescriptions[tabName];
}

function showStatus(id,msg,type){
  const el=document.getElementById(id);
  el.innerText=msg;
  el.className='status '+type;
  el.style.display='block';
  setTimeout(()=>{ el.style.display='none'; },4000);
}

// PDF → Word
async function pdfToWord(){
  const input=document.getElementById("pdfToWordFile");
  if(!input.files.length){ showStatus("pdfWordStatus","Select PDF first!","error"); return; }
  const file=input.files[0];
  const arrayBuffer=await file.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data:arrayBuffer}).promise;
  let fullText="";
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    fullText+=content.items.map(item=>item.str).join(" ")+"\n\n";
  }
  const { Document, Packer, Paragraph, TextRun }=window.docx;
  const doc=new Document({sections:[{properties:{},children:[new Paragraph({children:[new TextRun(fullText)])}]}]});
  const blob=await Packer.toBlob(doc);
  saveAs(blob,"converted.docx");
  showStatus("pdfWordStatus","PDF converted to Word!","success");
}

// PDF → JPG
async function pdfToJpg(){
  const input=document.getElementById("pdfToJpgFile");
  if(!input.files.length){ showStatus("pdfJpgStatus","Select PDF!","error"); return; }
  const file=input.files[0];
  const arrayBuffer=await file.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data: arrayBuffer}).promise;
  const canvas=document.createElement("canvas");
  const ctx=canvas.getContext("2d");
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const viewport=page.getViewport({scale:2});
    canvas.width=viewport.width; canvas.height=viewport.height;
    await page.render({canvasContext:ctx, viewport:viewport}).promise;
    canvas.toBlob(blob=>{ saveAs(blob, `page_${i}.jpg`); },'image/jpeg',0.95);
  }
  showStatus("pdfJpgStatus","PDF converted to JPG!","success");
}

// JPG → PDF
async function jpgToPdf(){
  const input=document.getElementById("jpgToPdfFile");
  if(!input.files.length){ showStatus("jpgPdfStatus","Select JPG(s)!","error"); return; }
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  for(let i=0;i<input.files.length;i++){
    const file=input.files[i];
    const imgData = await fileToDataURL(file);
    pdf.add
