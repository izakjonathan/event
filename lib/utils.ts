export const cx=(...v:(string|false|undefined|null)[])=>v.filter(Boolean).join(' ');
export const cleanUrl=(u:string)=>{const s=(u||'').trim();if(!s)return '';return /^https?:\/\//i.test(s)?s:`https://${s}`};
export const publicArtistFormLink=()=> typeof window==='undefined'?'/artist-booking':`${window.location.origin}/artist-booking`;
export async function fileToDataUrl(file:File):Promise<string>{return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=rej;r.readAsDataURL(file)})}
export const dateSort=(a?:string,b?:string)=>(a||'9999').localeCompare(b||'9999');
