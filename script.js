// ===============================
// PUT YOUR SUPABASE VALUES HERE
// ===============================
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let documents = [];
let signatories = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  resetSignatories();
  await loadDocuments();
});

function resetSignatories(){
  signatories=[{name:"",signed:false,signedAt:"",receivedBy:"",receivedAt:""}];
  renderSignatories();
}

function openAddModal(){
  editingId=null;
  document.getElementById("modalTitle").textContent="Add Document";
  document.getElementById("saveButton").textContent="Save Document";
  clearForm();
  document.getElementById("modal").classList.add("show");
}

function closeModal(){document.getElementById("modal").classList.remove("show");}

function addSignatory(){
  signatories.push({name:"",signed:false,signedAt:"",receivedBy:"",receivedAt:""});
  renderSignatories();
}

function removeSignatory(i){
  if(signatories.length===1){alert("At least one signatory is required.");return;}
  signatories.splice(i,1); renderSignatories();
}

function renderSignatories(){
  const box=document.getElementById("signatoryContainer");
  box.innerHTML="";
  signatories.forEach((p,i)=>{
    const row=document.createElement("div");
    row.className="signatory";
    row.innerHTML=`
      <div class="number">${i+1}</div>
      <input placeholder="Signatory name" value="${esc(p.name)}" data-field="name">
      <input type="datetime-local" value="${localDateTime(p.signedAt)}" data-field="signedAt">
      <input placeholder="Received by" value="${esc(p.receivedBy)}" data-field="receivedBy">
      <input type="datetime-local" value="${localDateTime(p.receivedAt)}" data-field="receivedAt">
      <label class="signed"><input type="checkbox" ${p.signed?"checked":""} data-field="signed"> Signed</label>
      <button type="button" class="remove">×</button>`;
    row.querySelectorAll("[data-field]").forEach(el=>{
      el.addEventListener("change",()=>{
        const f=el.dataset.field;
        p[f]=el.type==="checkbox"?el.checked:el.value;
        if(f==="signed" && el.checked && !p.signedAt) p.signedAt=new Date().toISOString();
        if(f==="signed" && !el.checked) p.signedAt="";
        if(f==="signed") renderSignatories();
      });
    });
    row.querySelector(".remove").onclick=()=>removeSignatory(i);
    box.appendChild(row);
  });
}

async function saveDocument(){
  const btn=document.getElementById("saveButton");
  const date=document.getElementById("documentDate").value;
  const name=document.getElementById("documentName").value.trim();
  const year=document.getElementById("schoolYear").value.trim();
  const semester=document.getElementById("semester").value;
  const trusted=document.getElementById("trustedBy").value.trim();

  if(!date||!name||!year||!semester){alert("Please complete Date, Document Name, School Year, and Semester.");return;}
  if(signatories.some(x=>!x.name.trim())){alert("Please enter every signatory name.");return;}

  btn.disabled=true; btn.textContent="Saving...";

  try{
    let documentId=editingId;

    if(editingId){
      const {error}=await db.from("documents").update({
        document_date:date,document_name:name,school_year:year,semester, trusted_by:trusted
      }).eq("id",editingId);
      if(error) throw error;

      const {error:delError}=await db.from("signatories").delete().eq("document_id",editingId);
      if(delError) throw delError;
    }else{
      const {data,error}=await db.from("documents").insert({
        document_date:date,document_name:name,school_year:year,semester,trusted_by:trusted
      }).select("id").single();
      if(error) throw error;
      if(!data?.id) throw new Error("Supabase did not return a document ID.");
      documentId=data.id;
    }

    const rows=signatories.map(p=>({
      document_id:documentId,
      signatory_name:p.name.trim(),
      signed_at:p.signed?(p.signedAt?new Date(p.signedAt).toISOString():new Date().toISOString()):null,
      received_by:p.receivedBy.trim()||null,
      received_at:p.receivedAt?new Date(p.receivedAt).toISOString():null
    }));

    const {error:signError}=await db.from("signatories").insert(rows);
    if(signError) throw signError;

    alert(editingId?"Document updated successfully!":"Document saved successfully!");
    closeModal(); clearForm(); await loadDocuments();
  }catch(e){
    console.error(e);
    alert("DATABASE ERROR:\n\n"+e.message+"\n\nCheck your Supabase URL/key and RLS policies.");
  }finally{
    btn.disabled=false;
    btn.textContent=editingId?"Update Document":"Save Document";
  }
}

async function loadDocuments(){
  const {data,error}=await db.from("documents").select("*, signatories(*)").order("document_date",{ascending:false});
  if(error){console.error(error);alert("LOAD ERROR:\n\n"+error.message);return;}
  documents=data||[]; renderDocuments(); updateStats();
}

function getStatus(d){
  const s=d.signatories||[];
  if(!s.length)return "PENDING";
  const signed=s.filter(x=>x.signed_at).length;
  if(signed===s.length)return "COMPLETED";
  if(signed>0)return "FOR SIGNATURE";
  return "PENDING";
}

function renderDocuments(){
  const tbody=document.getElementById("documentTable");
  const q=document.getElementById("searchInput").value.toLowerCase();
  const filter=document.getElementById("statusFilter").value;
  tbody.innerHTML="";
  const list=documents.filter(d=>(d.document_name||"").toLowerCase().includes(q)&&(filter==="ALL"||getStatus(d)===filter));
  if(!list.length){tbody.innerHTML='<tr><td colspan="9" style="text-align:center">No documents found.</td></tr>';return;}

  list.forEach(d=>{
    const status=getStatus(d);
    const cls=status==="COMPLETED"?"completed":status==="FOR SIGNATURE"?"signature":"pending";
    const s=d.signatories||[];
    const sig=s.map(p=>`<div><b>${esc(p.signatory_name)}</b><br>${p.signed_at?'<span class="status completed">SIGNED</span><br><small>'+fmtDateTime(p.signed_at)+'</small>':'<span class="status pending">NOT SIGNED</span>'}</div><hr>`).join("");
    const rec=s.map(p=>`<div>${esc(p.received_by||"-")}${p.received_at?"<br><small>"+fmtDateTime(p.received_at)+"</small>":""}</div><hr>`).join("");
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${fmtDate(d.document_date)}</td><td><b>${esc(d.document_name)}</b></td><td>${esc(d.school_year||"-")}</td><td>${esc(d.semester||"-")}</td><td>${esc(d.trusted_by||"-")}</td><td>${sig}</td><td>${rec}</td><td><span class="status ${cls}">${status}</span></td><td><button class="edit">Edit</button><button class="delete">Delete</button></td>`;
    tr.querySelector(".edit").onclick=()=>editDocument(d.id);
    tr.querySelector(".delete").onclick=()=>deleteDocument(d.id);
    tbody.appendChild(tr);
  });
}

function editDocument(id){
  const d=documents.find(x=>x.id===id); if(!d)return;
  editingId=id;
  document.getElementById("modalTitle").textContent="Edit Document";
  document.getElementById("saveButton").textContent="Update Document";
  document.getElementById("documentDate").value=d.document_date||"";
  document.getElementById("documentName").value=d.document_name||"";
  document.getElementById("schoolYear").value=d.school_year||"";
  document.getElementById("semester").value=d.semester||"";
  document.getElementById("trustedBy").value=d.trusted_by||"";
  signatories=(d.signatories||[]).map(p=>({name:p.signatory_name||"",signed:!!p.signed_at,signedAt:p.signed_at||"",receivedBy:p.received_by||"",receivedAt:p.received_at||""}));
  if(!signatories.length)resetSignatories();else renderSignatories();
  document.getElementById("modal").classList.add("show");
}

async function deleteDocument(id){
  if(!confirm("Delete this document?"))return;
  const {error}=await db.from("documents").delete().eq("id",id);
  if(error){alert("DELETE ERROR:\n\n"+error.message);return;}
  await loadDocuments();
}

function clearForm(){
  ["documentDate","documentName","schoolYear","trustedBy"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("semester").value="";
  resetSignatories();
}

function updateStats(){
  let p=0,s=0,c=0;
  documents.forEach(d=>{const x=getStatus(d);if(x==="PENDING")p++;else if(x==="FOR SIGNATURE")s++;else c++;});
  document.getElementById("totalCount").textContent=documents.length;
  document.getElementById("pendingCount").textContent=p;
  document.getElementById("signatureCount").textContent=s;
  document.getElementById("completedCount").textContent=c;
}

function fmtDate(v){return v?new Date(v+"T00:00:00").toLocaleDateString("en-GB"):"-";}
function fmtDateTime(v){return v?new Date(v).toLocaleString("en-GB"):"-";}
function localDateTime(v){
  if(!v)return "";
  const d=new Date(v); if(isNaN(d))return "";
  const p=n=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function esc(v){
  return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
