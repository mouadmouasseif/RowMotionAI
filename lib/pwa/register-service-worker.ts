let registrationPromise:Promise<ServiceWorkerRegistration|null>|null=null;
export function registerServiceWorker(){
  if(typeof window==="undefined"||!("serviceWorker" in navigator)||process.env.NODE_ENV!=="production")return Promise.resolve(null);
  if(registrationPromise)return registrationPromise;
  registrationPromise=navigator.serviceWorker.register("/sw.js",{scope:"/"}).catch((error:unknown)=>{console.error("[RowMotion] Service worker registration failed:",error);registrationPromise=null;return null;});
  return registrationPromise;
}
