/* Chargement à la demande des bibliothèques externes.
 *
 * pdf.js et qrcodejs étaient chargés dans index.html, donc sur chaque
 * page : un résident qui ouvrait le fil d'actualité téléchargeait une
 * bibliothèque PDF dont il n'avait aucun usage, et attendait qu'elle
 * arrive avant de voir quoi que ce soit.
 *
 * Ici, chaque page demande ce dont elle a besoin au moment où elle en a
 * besoin. Un script déjà chargé n'est jamais retéléchargé, et deux
 * demandes simultanées partagent la même attente.
 */

const enCours = new Map()

function chargerScript(url) {
  if (enCours.has(url)) return enCours.get(url)

  const promesse = new Promise((resolve, reject) => {
    // Déjà présent dans la page (rechargement, autre composant) : rien à faire.
    const existant = document.querySelector(`script[src="${url}"]`)
    if (existant) {
      if (existant.dataset.charge === 'oui') return resolve()
      existant.addEventListener('load', () => resolve())
      existant.addEventListener('error', () => reject(new Error('Chargement impossible')))
      return
    }

    const balise = document.createElement('script')
    balise.src = url
    balise.async = true
    balise.addEventListener('load', () => {
      balise.dataset.charge = 'oui'
      resolve()
    })
    balise.addEventListener('error', () => {
      // On oublie l'échec pour qu'une nouvelle tentative soit possible
      enCours.delete(url)
      balise.remove()
      reject(new Error('Chargement impossible'))
    })
    document.head.appendChild(balise)
  })

  enCours.set(url, promesse)
  return promesse
}

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
const QRCODE = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'

/** Prépare pdf.js et renvoie la bibliothèque prête à l'emploi. */
export async function chargerPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib
  await chargerScript(PDFJS)
  if (!window.pdfjsLib) throw new Error('pdf.js introuvable après chargement')
  // Le worker n'est pas téléchargé ici : on indique seulement où le trouver.
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER
  return window.pdfjsLib
}

/** Prépare le générateur de QR codes. */
export async function chargerQRCode() {
  if (window.QRCode) return window.QRCode
  await chargerScript(QRCODE)
  if (!window.QRCode) throw new Error('qrcodejs introuvable après chargement')
  return window.QRCode
}
