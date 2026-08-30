/**
 * Certificate mailer for the Web Development Workshop.
 *
 * Deploy this as a Web App, then point APPS_SCRIPT_URL at the /exec URL.
 * The app server POSTs one certificate at a time; this sends it from the
 * Gmail account that owns the script.
 *
 * ── Setup ──────────────────────────────────────────────────────────────
 * 1. script.google.com → New project → paste this file over Code.gs
 * 2. Replace SHARED_SECRET below with a long random string, and put the SAME
 *    string in .env.local as APPS_SCRIPT_SECRET
 * 3. Deploy → New deployment → type "Web app"
 *      Execute as:      Me
 *      Who has access:  Anyone
 * 4. Authorise when prompted (it will warn "unverified" — that is your own
 *    script; continue via Advanced)
 * 5. Copy the /exec URL into .env.local as APPS_SCRIPT_URL
 *
 * ── Quota ──────────────────────────────────────────────────────────────
 * Consumer @gmail.com : 100 recipients / day
 * Google Workspace    : 1,500 recipients / day
 * GET the /exec URL in a browser to see how many you have left today.
 */

var SHARED_SECRET = 'REPLACE_WITH_A_LONG_RANDOM_STRING'

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return reply({ ok: false, error: 'empty request' })
    }

    var body = JSON.parse(e.postData.contents)

    // "Who has access: Anyone" means this URL is public, so the secret is the
    // only thing standing between the internet and your send quota.
    if (!SHARED_SECRET || body.secret !== SHARED_SECRET) {
      return reply({ ok: false, error: 'unauthorized' })
    }
    if (!body.to || !body.subject) {
      return reply({ ok: false, error: 'missing to/subject' })
    }

    var options = {
      htmlBody: body.html || '',
      name: body.fromName || 'Web Development Workshop',
    }

    if (body.pdfBase64 && body.filename) {
      options.attachments = [
        Utilities.newBlob(
          Utilities.base64Decode(body.pdfBase64),
          'application/pdf',
          body.filename
        ),
      ]
    }

    if (body.replyTo) options.replyTo = body.replyTo

    GmailApp.sendEmail(body.to, body.subject, body.text || '', options)

    return reply({
      ok: true,
      remainingQuota: MailApp.getRemainingDailyQuota(),
    })
  } catch (err) {
    return reply({ ok: false, error: String(err) })
  }
}

/** Health check. Open the /exec URL in a browser to see today's quota. */
function doGet() {
  return reply({
    ok: true,
    service: 'workshop-certificate-mailer',
    remainingQuota: MailApp.getRemainingDailyQuota(),
  })
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  )
}
