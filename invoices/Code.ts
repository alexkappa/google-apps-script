/**
 * Adds a menu item to the SpreadsheetApp that allow users to trigger the
 * creation of a new invoice.
 */
function onOpen() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // List all available invoices (Sheets) and keep track of the current one.
  const invoices = spreadsheet.getSheets().map((sheet) => sheet.getName());
  const currentInvoice = spreadsheet.getActiveSheet();

  const today = new Date();

  // Calculate the current and the next invoice number.
  const nextInvoiceNum = calculateInvoiceNumber(today);
  const currentInvoiceNum = currentInvoice.getName();

  // Create a new menu item.
  const menu = SpreadsheetApp.getUi().createMenu("Invoice");

  // Only show the "Create Invoice" menu item if the next invoice number is not
  // present in the list of existing sheets.
  if (!invoices.includes(nextInvoiceNum)) {
    menu
      .addItem(`Create Invoice (#${nextInvoiceNum})`, "createInvoice")
      .addSeparator();
  }

  // Add the "Download Invoice" and "Email Invoice" menu items.
  menu
    .addItem(`Download Invoice (#${currentInvoiceNum})`, "downloadInvoice")
    .addItem(`Email Invoice (#${currentInvoiceNum})`, "emailInvoice")
    .addToUi();
}

/**
 * Creates a new invoice.
 *
 * To do so, this script looks for a template Sheet named YYYY-NNN in the active
 * Spreadsheet. Once found, it is copied and named according to the current year
 * and month.
 *
 * For example, the invoice number for September 2023 is 2023-009.
 *
 * Once the invoice is created, the date is modified (Cell F12) to reflect the
 * last day of the current month. Formulas in the template sheet take care of
 * the rest.
 */
function createInvoice() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  const today = new Date();

  // Calculate the last day of the month and the invoice number.
  const endOfMonth = calculateEndOfMonth(today);
  const invoiceNum = calculateInvoiceNumber(today);

  // Find the template sheet.
  const template = spreadsheet.getSheetByName("YYYY-NNN");

  // Copy the template sheet and set the invoice number and issue date.
  const invoice = template.copyTo(spreadsheet);
  invoice.setName(invoiceNum);
  invoice.getRange("F12").getCell(1, 1).setValue(endOfMonth);
  invoice.setTabColor("#6aa84f");

  // Move the new invoice to the first position and make it active.
  spreadsheet.setActiveSheet(invoice);
  spreadsheet.moveActiveSheet(1);

  // Remove the tab color from all other sheets.
  spreadsheet
    .getSheets()
    .filter((sheet) => sheet.getSheetId() !== invoice.getSheetId())
    .forEach((sheet) => sheet.setTabColor(null));
}

/**
 * Calculates the last day of the month.
 *
 * @param {Date} now The current date
 * @returns {Date} A date set to the last day of the current month
 */
export function calculateEndOfMonth(now: Date): Date {
  return new Date(
    now.getFullYear(), // current year
    now.getMonth() + 1, // next month
    0 // first day - 1
  );
}

/**
 * Calculates the invoice number for the given date.
 *
 * @param {Date} now The current date
 * @returns {string} The invoice number
 */
export function calculateInvoiceNumber(now: Date): string {
  const yy = now.getFullYear();
  const mm = now.getMonth() + 1;

  return `${yy}-${mm.toString().padStart(3, "0")}`;
}

/**
 * Exports a Sheet to a PDF file.
 */
function downloadInvoice() {
  const now = new Date();

  // Get the current invoice.
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const currentInvoice = spreadsheet.getActiveSheet();

  // Create a temporary spreadsheet. This is needed because we can only get a
  // PDF programmatically from an entire Spreadsheet, not a single Sheet.
  const tmpSpreadsheet = SpreadsheetApp.create(
    `${spreadsheet} - ${currentInvoice.getName()}`
  );

  // Copy the current invoice to the temporary spreadsheet.
  const tmpSheet = currentInvoice.copyTo(tmpSpreadsheet);
  tmpSpreadsheet.getSheets().forEach((sheet) => {
    if (sheet.getName() !== tmpSheet.getName()) {
      tmpSpreadsheet.deleteSheet(sheet);
    }
  });

  // Export the temporary spreadsheet as a PDF file and save it in the Invoices
  // directory.
  const fileContent = tmpSpreadsheet.getAs("application/pdf");
  const file = DriveApp.createFile(fileContent).setName(
    `alexkappa-invoice-${currentInvoice.getName()}.pdf`
  );

  // Move the file to the Invoices directory.
  DriveApp.getFoldersByName("Invoices")
    .next()
    .getFoldersByName(`${now.getFullYear()}`)
    .next()
    .addFile(file);

  // Remove the temporary files.
  DriveApp.getRootFolder().removeFile(file);
  DriveApp.getRootFolder().removeFile(
    DriveApp.getFileById(tmpSpreadsheet.getId())
  );

  SpreadsheetApp.getUi().alert(
    `Invoice saved in the Invoices/${now.getFullYear()} folder.`
  );
}

/**
 * Email the current invoice as a PDF attachment.
 */
function emailInvoice() {
  const now = new Date();
  const nowFormatted = Utilities.formatDate(now, "GMT", "MMMMM yyyy");

  // Get the current invoice.
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const currentInvoice = spreadsheet.getActiveSheet();

  // Create a temporary spreadsheet. This is needed because we can only get a
  // PDF programmatically from an entire Spreadsheet, not a single Sheet.
  const tmpSpreadsheet = SpreadsheetApp.create(
    `${spreadsheet} - ${currentInvoice.getName()}`
  );

  // Copy the current invoice to the temporary spreadsheet.
  const tmpSheet = currentInvoice.copyTo(tmpSpreadsheet);
  tmpSpreadsheet.getSheets().forEach((sheet) => {
    if (sheet.getName() !== tmpSheet.getName()) {
      tmpSpreadsheet.deleteSheet(sheet);
    }
  });

  // Export the temporary spreadsheet as a PDF file and save it in the Invoices
  // directory.
  const fileContent = tmpSpreadsheet.getAs("application/pdf");
  const file = DriveApp.createFile(fileContent).setName(
    `alexkappa-invoice-${currentInvoice.getName()}.pdf`
  );

  const email = Session.getActiveUser().getEmail();

  // Send the invoice via email as an attachment.
  MailApp.sendEmail(
    email,
    `Invoice #${currentInvoice.getName()} - ${nowFormatted}`,
    `Hi team,

Please find attached the invoice for ${nowFormatted}.
    
Kind regards,
Alex`,
    {
      attachments: [file],
    }
  );

  // Remove the temporary files.
  DriveApp.getRootFolder().removeFile(file);
  DriveApp.getRootFolder().removeFile(
    DriveApp.getFileById(tmpSpreadsheet.getId())
  );

  SpreadsheetApp.getUi().alert(`Invoice sent to ${email}`);
}
