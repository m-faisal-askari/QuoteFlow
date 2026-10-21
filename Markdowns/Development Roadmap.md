# **Development Roadmap**

## **PHASE 0: Define the product**

Before opening VS Code, freeze the first version.

### **V0.1 goal**

A user can:

1. Enter business information  
2. Enter/select a customer  
3. Create a quotation  
4. Add/remove line items  
5. Automatically calculate totals  
6. See a live preview  
7. Save the document  
8. Reopen/edit it  
9. Download it as PDF  
10. Print it

That's your MVP.

### **Explicitly exclude**

For V0.1:

* Authentication  
* Database  
* Payments  
* Email  
* Cloud storage  
* Team accounts  
* AI  
* Accounting  
* Tax compliance  
* Online payment collection

If you can't build the above 10 things reliably, adding another 30 features is pointless.

---

# **PHASE 1: Project setup**

### **Step 1: Create the project**

Use:

npm create vite@latest quoteflow

Choose:

React  
TypeScript

Then:

cd quoteflow  
npm install  
npm run dev

### **Step 2: Establish the basic structure**

Don't immediately create 70 components.

Start with something understandable:

src/  
├── assets/  
├── components/  
├── pages/  
├── types/  
├── utils/  
├── hooks/  
├── data/  
├── App.tsx  
├── main.tsx  
└── index.css

You'll expand this structure when the application actually needs it.

---

# **PHASE 2: Design system**

Before building functionality, establish your visual language.

### **Step 3: Define typography**

Choose one primary font.

For example:

**Inter**

Define:

* headings  
* body  
* labels  
* small text  
* numbers

### **Step 4: Define colors**

For example:

Background  
Surface  
Border  
Text  
Muted text  
Primary  
Success  
Warning  
Danger

Don't scatter random hex codes throughout your components.

### **Step 5: Define spacing**

Establish a consistent spacing system.

For example:

4  
8  
12  
16  
24  
32  
48

### **Step 6: Define common UI primitives**

Eventually you'll need:

* Button  
* Input  
* Select  
* Textarea  
* Modal  
* Badge  
* Card  
* Table  
* Dropdown

But only create components when they are actually needed.

---

# **PHASE 3: Application shell**

Now build the skeleton.

### **Step 7: Create the layout**

┌──────────────┬──────────────────────────────┐  
│              │                              │  
│   Sidebar    │          Main content        │  
│              │                              │  
│              │                              │  
└──────────────┴──────────────────────────────┘

Build:

* Sidebar  
* Header  
* Main content area

### **Step 8: Sidebar navigation**

Add:

Dashboard  
Documents  
Quotations  
Invoices  
Customers  
Settings

Don't worry if most pages don't work yet.

---

# **PHASE 4: Data model**

This is where TypeScript becomes useful.

### **Step 9: Define your types**

Start with:

BusinessProfile  
Customer  
LineItem  
Quotation  
Invoice  
Document

Conceptually:

BusinessProfile  
 ├── name  
 ├── logo  
 ├── email  
 ├── phone  
 └── address

And:

LineItem  
 ├── id  
 ├── description  
 ├── quantity  
 ├── unitPrice  
 └── amount

Then:

Document  
 ├── id  
 ├── type  
 ├── number  
 ├── customer  
 ├── items  
 ├── subtotal  
 ├── discount  
 ├── tax  
 ├── total  
 ├── status  
 └── dates

**Do this before building the document editor.**

Your data structure is the backbone of the application.

---

# **PHASE 5: Business profile**

### **Step 10: Build Settings**

Create:

**Business Profile**

Fields:

* Business name  
* Logo  
* Email  
* Phone  
* Website  
* Address  
* Tax ID  
* Default currency  
* Default payment terms

### **Step 11: Save the profile**

Initially:

React state  
     ↓  
localStorage

When the user refreshes the browser, the information remains.

---

# **PHASE 6: Customer system**

### **Step 12: Create customer page**

Build:

Customers

\[ \+ Add Customer \]

Customer        Company          Email  
John Smith      ABC Corp         john@abc.com  
Sarah Jones     XYZ Ltd          sarah@xyz.com

### **Step 13: Add customer form**

Fields:

* Name  
* Company  
* Email  
* Phone  
* Address  
* Notes

### **Step 14: Customer persistence**

Store customers in localStorage.

You now have your first actual data collection inside the application.

---

# **PHASE 7: Quotation editor**

This is the heart of the project.

### **Step 15: Create the quotation page**

Route:

/quotations/new

Layout:

Editor              Preview  
──────────          ──────────  
Business            Document  
Customer            Document  
Details             Document  
Items               Document  
Pricing             Document  
Notes               Document

### **Step 16: Business information**

Automatically populate from the business profile.

Don't make users re-enter it.

---

### **Step 17: Customer selection**

Instead of typing everything manually:

Customer  
\[ Select customer ▼ \]

Selecting John Smith populates:

* company  
* email  
* phone  
* address

---

### **Step 18: Quotation details**

Add:

* Quote number  
* Issue date  
* Expiry date  
* Currency

Automatically generate quote numbers:

QT-0001  
QT-0002  
QT-0003

Don't make users type them.

---

# **PHASE 8: Line-item engine**

### **Step 19: Build the line-item table**

Each row:

Description | Qty | Unit Price | Amount | Delete

### **Step 20: Add items**

Button:

**\+ Add Item**

Creates a new row.

### **Step 21: Remove items**

Trash icon removes the row.

### **Step 22: Calculate item totals**

amount \= quantity × unitPrice

### **Step 23: Calculate subtotal**

subtotal \= sum(all item amounts)

At this point, test the calculations heavily.

---

# **PHASE 9: Discount and tax**

### **Step 24: Discount**

Support:

Fixed  
Percentage

### **Step 25: Tax**

Support:

Tax percentage

### **Step 26: Final calculation**

Your calculation pipeline should effectively be:

Line Items  
    ↓  
Subtotal  
    ↓  
Discount  
    ↓  
Tax  
    ↓  
Final Total

Create these calculations in utility functions rather than burying the mathematics inside UI components.

That will make the code much easier to test.

---

# **PHASE 10: Live preview**

Now build the second half of the product.

### **Step 27: Create document preview**

Render:

Business  
       ↓  
Quotation heading  
       ↓  
Customer  
       ↓  
Items  
       ↓  
Pricing  
       ↓  
Notes

### **Step 28: Connect editor → preview**

This is the important part.

User changes input  
       ↓  
Application state  
       ↓  
Preview re-renders

Don't make the preview maintain a second copy of the data.

**One source of truth.**

---

# **PHASE 11: Templates**

Only after one template works perfectly.

### **Step 29: Build Template 1**

Minimal professional design.

### **Step 30: Separate data from presentation**

Your architecture should conceptually become:

Document Data  
      ↓  
Template  
      ↓  
Rendered Document

Then:

Template 1  
Template 2  
Template 3

can all consume the same document.

### **Step 31: Template selector**

Template

○ Minimal  
○ Modern  
○ Classic  
---

# **PHASE 12: Document persistence**

Now save quotations.

### **Step 32: Create document storage**

Store:

documents\[\]

Each document has:

* ID  
* type  
* number  
* customer  
* items  
* pricing  
* status  
* dates

### **Step 33: Save draft**

Button:

**Save Draft**

### **Step 34: Edit existing quotation**

Route:

/quotations/:id

Load the document.

### **Step 35: Delete**

Add confirmation:

> Delete this quotation?

### **Step 36: Duplicate**

Extremely useful:

> Duplicate quotation

This creates a new document number while copying the contents.

---

# **PHASE 13: Document management**

Now create:

/Documents

Build a table:

Document  
Customer  
Type  
Amount  
Status  
Date  
Actions

### **Step 37: Search**

Search:

* customer  
* document number

### **Step 38: Filters**

Filter by:

* quotation  
* invoice  
* status  
* date

### **Step 39: Sorting**

Sort by:

* newest  
* oldest  
* amount  
* customer

---

# **PHASE 14: PDF**

Now you have something worth exporting.

### **Step 40: PDF generation**

Take the same document preview and generate a PDF.

Test:

* long customer names  
* many line items  
* long descriptions  
* different currencies  
* discounts  
* taxes  
* empty optional fields

Don't declare this feature finished just because a PDF was generated once.

---

# **PHASE 15: Printing**

### **Step 41: Print stylesheet**

Create a dedicated print layout.

Test it in:

**Chrome → Print Preview**

Make sure you don't accidentally print:

* sidebar  
* editor controls  
* buttons  
* application background

Only the actual document should print.

---

# **PHASE 16: Invoice system**

Now reuse what you've already built.

### **Step 42: Invoice data**

Add:

* Invoice number  
* Issue date  
* Due date  
* Payment status

### **Step 43: Invoice editor**

Reuse the quotation editor.

Don't copy/paste the entire component.

Think:

DocumentEditor  
      ↓  
Quotation  
Invoice

### **Step 44: Invoice preview**

Same principle.

### **Step 45: Invoice templates**

Reuse your template system.

---

# **PHASE 17: Quotation → Invoice**

### **Step 46: Conversion**

On a quotation:

**Convert to Invoice**

The system:

QT-0008  
    ↓  
INV-0004

Copies:

* customer  
* items  
* pricing  
* notes

But generates:

* new invoice number  
* invoice date  
* due date  
* invoice status

This is a very good feature to demonstrate in your portfolio.

---

# **PHASE 18: Invoice statuses**

Implement:

Draft  
Sent  
Unpaid  
Partially Paid  
Paid  
Overdue  
Cancelled

For the frontend-only version, these are simply application states.

Don't pretend you're verifying actual payments.

---

# **PHASE 19: Dashboard**

Now that actual documents exist, the dashboard becomes meaningful.

Calculate:

Total invoices  
Total quotations  
Paid amount  
Outstanding amount  
Overdue amount

Then:

### **Recent documents**

Display the latest documents.

### **Quick actions**

\+ New Invoice  
\+ New Quotation

Only build charts if they actually communicate useful information.

---

# **PHASE 20: UX hardening**

Now stop adding features.

Start breaking your application.

Test:

### **Empty states**

* No documents  
* No customers  
* No business profile

### **Bad input**

* Negative quantity  
* Empty description  
* Invalid email  
* Invalid price

### **Edge cases**

* 100 line items  
* Very long company name  
* Huge price  
* 0% tax  
* 0% discount  
* No logo  
* No notes

### **Browser behavior**

* Refresh  
* Close/reopen  
* Back button  
* Forward button

This phase is where a project goes from **demo** to **software**.

---

# **PHASE 21: Responsive design**

Don't leave this until the final hour.

Test:

### **Desktop**

Editor | Preview

### **Tablet**

Editor  
Preview

### **Mobile**

Editor  
↓  
Preview  
↓  
Actions

Pay particular attention to:

* line-item tables  
* document preview  
* navigation  
* forms  
* buttons

---

# **PHASE 22: Accessibility**

Check:

* keyboard navigation  
* focus states  
* labels  
* semantic HTML  
* contrast  
* button names  
* form errors

Use Lighthouse and browser accessibility tools.

---

# **PHASE 23: Testing**

You don't need an enormous test suite.

But test the important business logic.

For example:

quantity  × price  
discount  
tax  
subtotal  
total

Test:

1 × \$100 \= \$100  
5 × \$20 \= \$100  
10% discount on \$100 \= \$90

This is especially important because financial calculations are not a place for sloppy code.

---

# **PHASE 24: Deployment**

Deploy the first usable version.

For example:

GitHub  
   ↓  
Vercel  
   ↓  
quoteflow.yourdomain.com

Now you have a real URL.

---

# **PHASE 25: Get actual users**

This is where the project stops being a portfolio exercise.

Your first goal:

### **10 real users**

Not 10,000 visitors.

Find:

* freelancers  
* designers  
* developers  
* photographers  
* small agencies  
* contractors  
* local businesses

Show them the application.

Don't ask:

> "Do you like it?"

Ask:

> "Can you create an invoice using this?"

Then watch.

That's much better user research.

---

# **PHASE 26: Measure usage**

Add basic analytics.

Track events such as:

app\_opened  
quotation\_created  
quotation\_saved  
invoice\_created  
pdf\_downloaded  
document\_deleted

Eventually you can say:

> 143 quotations created.

That's far more useful than:

> 2,000 page views.

---

# **PHASE 27: Iterate based on users**

Only now start adding features.

Suppose users repeatedly say:

> "I want to duplicate invoices."

Build it.

They say:

> "I need my logo."

Build it.

They say:

> "I want to send the invoice directly."

Investigate email delivery.

Don't build features because they look impressive in a portfolio.

Build them because users demonstrate demand.

---

# **PHASE 28: V0.2 backend**

Only after you have evidence that people actually use the product.

Then introduce:

React  
 ↓  
API  
 ↓  
Database

Add:

* authentication  
* cloud documents  
* user accounts  
* cloud customer database  
* cross-device access  
* backups

This gives you a natural path from your **frontend portfolio project** into a **full-stack application** later.

---

# **Final hierarchy**

Your entire development sequence should look like this:

1\. PRODUCT DEFINITION  
       ↓  
2\. PROJECT SETUP  
       ↓  
3\. DESIGN SYSTEM  
       ↓  
4\. APPLICATION SHELL  
       ↓  
5\. DATA MODELS  
       ↓  
6\. BUSINESS PROFILE  
       ↓  
7\. CUSTOMERS  
       ↓  
8\. QUOTATION EDITOR  
       ↓  
9\. LINE ITEMS  
       ↓  
10\. CALCULATIONS  
       ↓  
11\. LIVE PREVIEW  
       ↓  
12\. TEMPLATES  
       ↓  
13\. LOCAL PERSISTENCE  
       ↓  
14\. DOCUMENT MANAGEMENT  
       ↓  
15\. PDF  
       ↓  
16\. PRINT  
       ↓  
17\. INVOICES  
       ↓  
18\. QUOTATION → INVOICE  
       ↓  
19\. DASHBOARD  
       ↓  
20\. UX / EDGE CASES  
       ↓  
21\. RESPONSIVE  
       ↓  
22\. ACCESSIBILITY  
       ↓  
23\. TESTING  
       ↓  
24\. DEPLOYMENT  
       ↓  
25\. REAL USERS  
       ↓  
26\. MEASURE  
       ↓  
27\. ITERATE  
       ↓  
28\. BACKEND / CLOUD

## **The critical stopping points**

There are **three milestones** where you should stop and evaluate rather than blindly continue.

### **Milestone 1**

**Quotation → Preview → PDF works.**

You have an MVP.

### **Milestone 2**

**Quotation \+ Invoice \+ Customers \+ Documents work.**

You have a credible portfolio application.

### **Milestone 3**

**Real people are using it.**

Now you have something much more valuable than a portfolio project.

You have **product experience**.

And for your particular situation, I would make **Milestone 3 the actual definition of success**. The objective isn't to build the world's best invoice application. It's to have something you can truthfully put on your resume as:

> **Designed, developed, deployed, and iterated on a production web application used by real users.**

That is the evidence you're currently missing.

