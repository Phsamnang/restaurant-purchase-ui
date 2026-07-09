export type Language = 'en' | 'kh';

export interface Dictionary {
  nav: {
    orders: string;
    createOrder: string;
    dashboard: string;
    logout: string;
    switchLang: string;
    brandSub: string;
    finance: string;
  };
  common: {
    loading: string;
    cancel: string;
    back: string;
    clear: string;
    optional: string;
    confirm: string;
    close: string;
    all: string;
    search: string;
  };
  market: {
    title: string;
    subtitle: string;
    morningMarket: string;
    posVersion: string;
    chefAuthorized: string;
    addCustomItem: string;
    searchPlaceholder: string;
    itemsAvailable: string;
    clickTip: string;
    modeLabel: string;
    modeGlossary: string;
    modeGlossarySub: string;
    modeStuff: string;
    modeStuffSub: string;
    stuffTitle: string;
    stuffSubtitle: string;
    addCustomStuff: string;
  };
  list: {
    glossary: string;
    itemNameKh: string;
    category: string;
    priceUnit: string;
    status: string;
    inList: string;
    select: string;
    per: string;
    noItems: string;
    noItemsSub: string;
  };
  modal: {
    editing: string;
    quantity: string;
    stepTip: string;
    quickAdd: string;
    unit: string;
    price: string;
    pricePerUnit: string;
    vendor: string;
    supplier: string;
    amountRequested: string;
    paidTo: string;
    notes: string;
    notesPlaceholder: string;
    lineTotal: string;
    cancel: string;
    addToList: string;
    updateList: string;
  };
  basket: {
    title: string;
    subtitle: string;
    clearList: string;
    emptyTitle: string;
    emptySub: string;
    chefTip: string;
    totalSelected: string;
    totalUnits: string;
    items: string;
    units: string;
    estCost: string;
    estCostSub: string;
    reviewSend: string;
    sending: string;
    paperTip: string;
    estTotal: string;
    listEmpty: string;
    reviewBtn: string;
  };
  custom: {
    title: string;
    alert: string;
    enName: string;
    khName: string;
    category: string;
    defaultUnit: string;
    priceUnit: string;
    createOrder: string;
  };
  review: {
    title: string;
    sentTitle: string;
    sentSub: string;
    redirecting: string;
    targetDate: string;
    priority: string;
    priorityNormal: string;
    priorityUrgent: string;
    priorityScheduled: string;
    selectedItems: string;
    lineTotal: string;
    totalCost: string;
    totalCostSub: string;
    confirmSend: string;
    routing: string;
  };
  orders: {
    title: string;
    subtitle: string;
    newRequest: string;
    filterAll: string;
    filterPending: string;
    filterApproved: string;
    filterSent: string;
    filterDiscrepancy: string;
    filterCompleted: string;
  };
  finance: {
    title: string;
    subtitle: string;
    income: string;
    outcome: string;
    netFlow: string;
    recordSales: string;
    recordExpense: string;
    tabAll: string;
    tabIncome: string;
    tabOutcome: string;
    monthlyReport: string;
    todayCash: string;
  };
}

export const translations: Record<Language, Dictionary> = {
  en: {
    nav: {
      orders: "Orders",
      createOrder: "+ Create Order",
      dashboard: "Dashboard",
      logout: "Logout",
      switchLang: "Switch to Khmer (ខ្មែរ)",
      brandSub: "Enterprise ERP",
      finance: "Finance",
    },
    common: {
      loading: "Loading Restaurant POS Catalog...",
      cancel: "Cancel",
      back: "Back",
      clear: "Clear",
      optional: "Optional",
      confirm: "Confirm",
      close: "Close",
      all: "All",
      search: "Search",
    },
    market: {
      title: "Chef's Market Glossary",
      subtitle: "Create market shopping lists for chefs & managers (no paper printing required)",
      morningMarket: "Morning Market",
      posVersion: "POS Procurement v2.4",
      chefAuthorized: "Kitchen Authorized",
      addCustomItem: "Add Custom Item",
      searchPlaceholder: "Search ingredient by English or Khmer name...",
      itemsAvailable: "items available",
      clickTip: "💡 Click any item to add it to your digital request list",
      modeLabel: "What do you want to buy/request?",
      modeGlossary: "Ingredient Glossary (ផ្សារព្រឹក)",
      modeGlossarySub: "Fresh food, meat, vegetables, seafood & daily pantry items",
      modeStuff: "Supplies, Glassware & Cash / Tip (សម្ភារៈ/ប្រាក់)",
      modeStuffSub: "Glassware, tableware, tools, cleaning, petty cash & staff tip advance",
      stuffTitle: "Supplies, Equipment & Cash Requisition",
      stuffSubtitle: "Request glassware, kitchen tools, cleaning supplies, petty cash & staff tip advance",
      addCustomStuff: "Add Custom Supply / Cash Request",
    },
    list: {
      glossary: "Item Name",
      itemNameKh: "ឈ្មោះមុខទំនិញ",
      category: "Category",
      priceUnit: "Est. Price / Unit",
      status: "Add / Quantity",
      inList: "In List",
      select: "Select",
      per: "per",
      noItems: "No ingredients found in this category",
      noItemsSub: "Try selecting a different category or searching again",
    },
    modal: {
      editing: "Editing List Item",
      quantity: "Quantity Needed",
      stepTip: "Step by ±1 or use quick pills",
      quickAdd: "Quick Add:",
      unit: "Unit",
      price: "Price ($)",
      pricePerUnit: "Price Per Unit",
      vendor: "Preferred Vendor",
      supplier: "Supplier",
      amountRequested: "Amount Requested",
      paidTo: "Paid To",
      notes: "Chef Notes",
      notesPlaceholder: "e.g., Please select large size, fresh morning delivery...",
      lineTotal: "Estimated Line Total",
      cancel: "Cancel",
      addToList: "Add to Market List",
      updateList: "Update Market List",
    },
    basket: {
      title: "Market Shopping List",
      subtitle: "Daily market shopping list (no paper printing required)",
      clearList: "Clear List",
      emptyTitle: "Your Market List is Empty",
      emptySub: "Select ingredients from the catalog on the left to build your digital shopping list",
      chefTip: "💡 Chef Tip: Walk around your kitchen & tap ingredients on the left to build your shopping list digitally!",
      totalSelected: "Total Ingredients Selected",
      totalUnits: "Total Procurement Units",
      items: "items",
      units: "units",
      estCost: "Estimated Market Cost",
      estCostSub: "Daily procurement estimation",
      reviewSend: "Review & Send Market List",
      sending: "Sending Market List...",
      paperTip: "⚡ Replaces paper lists! Directly sent to kitchen manager & supplier",
      estTotal: "Est. Total",
      listEmpty: "List Empty",
      reviewBtn: "Review",
    },
    custom: {
      title: "Add Custom Market Item",
      alert: "This custom item will be added to your current session catalog and can be ordered immediately.",
      enName: "English Name",
      khName: "Khmer Name",
      category: "Category",
      defaultUnit: "Default Unit",
      priceUnit: "Estimated Price per Unit ($)",
      createOrder: "Create & Order",
    },
    review: {
      title: "Review Market List",
      sentTitle: "Market List Sent!",
      sentSub: "Your market shopping list has been routed to the kitchen manager and vendor (no paper needed)",
      redirecting: "⚡ Redirecting to Purchase Orders...",
      targetDate: "Target Delivery Date",
      priority: "Order Priority",
      priorityNormal: "Normal (Standard Morning Delivery)",
      priorityUrgent: "🚨 Urgent (Need ASAP)",
      priorityScheduled: "Scheduled (Specific Date)",
      selectedItems: "Selected Ingredients",
      lineTotal: "Line Total",
      totalCost: "Total Estimated Market Cost",
      totalCostSub: "Daily estimated total",
      confirmSend: "Confirm & Send Market List",
      routing: "Routing Order...",
    },
    orders: {
      title: "Purchase Requests & Market Orders",
      subtitle: "Manage daily kitchen requisitions, vendor POs, and delivery receiving",
      newRequest: "+ New Market Order",
      filterAll: "All Orders",
      filterPending: "Pending",
      filterApproved: "Approved",
      filterSent: "Sent to Supplier",
      filterDiscrepancy: "Discrepancies",
      filterCompleted: "Received / Completed",
    },
    finance: {
      title: "Income & Outcome Tracking",
      subtitle: "Monitor daily sales revenue, purchase expenses, and net cash flow",
      income: "Total Income",
      outcome: "Total Outcome",
      netFlow: "Net Cash Flow",
      recordSales: "+ Record Daily Sales",
      recordExpense: "+ Record Expense",
      tabAll: "All Transactions",
      tabIncome: "Income Only",
      tabOutcome: "Outcome Only",
      monthlyReport: "Monthly Financial Report",
      todayCash: "Today's Cash Position",
    },
  },
  kh: {
    nav: {
      orders: "បញ្ជីទិញ",
      createOrder: "+ បង្ហោះការបញ្ជាទិញ",
      dashboard: "ផ្ទាំងគ្រប់គ្រង",
      logout: "ចាកចេញ",
      switchLang: "ប្តូរទៅ English (អង់គ្លេស)",
      brandSub: "ប្រព័ន្ធគ្រប់គ្រង ERP",
      finance: "ហិរញ្ញវត្ថុ",
    },
    common: {
      loading: "កំពុងទាញយកទិន្នន័យទំនិញ...",
      cancel: "បោះបង់",
      back: "ត្រឡប់",
      clear: "លុប",
      optional: "ជម្រើស",
      confirm: "បញ្ជាក់",
      close: "បិទ",
      all: "ទាំងអស់",
      search: "ស្វែងរក",
    },
    market: {
      title: "បញ្ជីទំនិញផ្សារសម្រាប់ចុងភៅ",
      subtitle: "បង្កើតបញ្ជីទំនិញផ្សារសម្រាប់ចុងភៅ និងអ្នកគ្រប់គ្រង (ជំនួសការព្រីនក្រដាស)",
      morningMarket: "ផ្សារព្រឹក",
      posVersion: "ប្រព័ន្ធទិញទំនិញ v2.4",
      chefAuthorized: "ចុងភៅមានសិទ្ធិ",
      addCustomItem: "ថែមមុខទំនិញថ្មី",
      searchPlaceholder: "ស្វែងរកឈ្មោះទំនិញជាភាសាខ្មែរ ឬអង់គ្លេស...",
      itemsAvailable: "មុខទំនិញមាន",
      clickTip: "💡 ចុចលើមុខទំនិញណាមួយដើម្បីបន្ថែមចូលបញ្ជីទិញ ឬសំណូមពររបស់អ្នក",
      modeLabel: "តើអ្នកចង់ទិញ ឬស្នើសុំអ្វី?",
      modeGlossary: "គ្រឿងផ្សំ / ផ្សារព្រឹក (Glossary)",
      modeGlossarySub: "សាច់ បន្លែ ត្រី គ្រឿងសមុទ្រ និងគ្រឿងទេសប្រចាំថ្ងៃ",
      modeStuff: "សម្ភារៈ កែវ និងប្រាក់ Tip (Stuff / Supplies)",
      modeStuffSub: "កែវ ចាន សម្ភារៈសម្អាត ឧបករណ៍ផ្ទះបាយ ដកប្រាក់ Tip និងប្រាក់បម្រុង",
      stuffTitle: "សំណូមពរសម្ភារៈ ឧបករណ៍ និងសាច់ប្រាក់",
      stuffSubtitle: "ស្នើសុំកែវ ឧបករណ៍ផ្ទះបាយ សម្ភារៈសម្អាត ដកប្រាក់ Tip និងប្រាក់បម្រុង",
      addCustomStuff: "ថែមសំណូមពរសម្ភារៈ / សាច់ប្រាក់",
    },
    list: {
      glossary: "ឈ្មោះមុខទំនិញ",
      itemNameKh: "Item Name",
      category: "ប្រភេទ",
      priceUnit: "តម្លៃប៉ាន់ស្មាន / ខ្នាត",
      status: "បន្ថែម / ចំនួន",
      inList: "ក្នុងបញ្ជី",
      select: "ជ្រើសរើស",
      per: "ក្នុងមួយ",
      noItems: "រកមិនឃើញមុខទំនិញក្នុងផ្នែកនេះទេ",
      noItemsSub: "សូមសាកល្បងជ្រើសរើសផ្នែកផ្សេង ឬស្វែងរកម្តងទៀត",
    },
    modal: {
      editing: "កំពុងកែសម្រួលទំនិញ",
      quantity: "ចំនួនត្រូវទិញ",
      stepTip: "បន្ថែម/បន្ថយ ឬប្រើប៊ូតុងលឿន",
      quickAdd: "បន្ថែមលឿន:",
      unit: "ខ្នាត",
      price: "តម្លៃ ($)",
      pricePerUnit: "តម្លៃក្នុងមួយឯកតា",
      vendor: "ទីផ្សារទិញ",
      supplier: "ក្រុមហ៊ុនផ្គត់ផ្គង់",
      amountRequested: "ចំនួនទឹកប្រាក់ស្នើសុំ",
      paidTo: "ទូទាត់ជូន",
      notes: "កំណត់សម្គាល់ចុងភៅ",
      notesPlaceholder: "ឧទាហរណ៍៖ សូមជ្រើសរើសទំហំធំ ស្រស់ល្អ...",
      lineTotal: "តម្លៃសរុបប៉ាន់ស្មាន",
      cancel: "បោះបង់",
      addToList: "បន្ថែមចូលបញ្ជី",
      updateList: "កែសម្រួលបញ្ជី",
    },
    basket: {
      title: "បញ្ជីទំនិញត្រូវទិញ",
      subtitle: "បញ្ជីទំនិញត្រូវទិញផ្សារប្រចាំថ្ងៃ (មិនបាច់ព្រីនក្រដាស)",
      clearList: "លុបបញ្ជី",
      emptyTitle: "បញ្ជីទំនិញរបស់អ្នកនៅទទេ",
      emptySub: "សូមជ្រើសរើសមុខទំនិញពីតារាងខាងឆ្វេង ដើម្បីរៀបចំបញ្ជីទិញផ្សារដោយមិនបាច់ព្រីនក្រដាស",
      chefTip: "💡 គន្លឹះចុងភៅ៖ ដើរពិនិត្យក្នុងផ្ទះបាយ ហើយចុចលើមុខទំនិញខាងឆ្វេងដើម្បីបង្កើតបញ្ជីទិញផ្សារក្នុងទូរស័ព្ទ!",
      totalSelected: "មុខទំនិញសរុប",
      totalUnits: "ចំនួនខ្នាតសរុប",
      items: "មុខ",
      units: "ខ្នាត",
      estCost: "តម្លៃប៉ាន់ស្មានសរុប",
      estCostSub: "តម្លៃប៉ាន់ស្មានប្រចាំថ្ងៃ",
      reviewSend: "ពិនិត្យ និងបញ្ជូនបញ្ជី",
      sending: "កំពុងបញ្ជូនបញ្ជី...",
      paperTip: "⚡ ជំនួសក្រដាសព្រីន! បញ្ជូនត្រង់ទៅកាន់អ្នកគ្រប់គ្រង និងអ្នកផ្គត់ផ្គង់",
      estTotal: "តម្លៃសរុប",
      listEmpty: "បញ្ជីទទេ",
      reviewBtn: "ពិនិត្យ",
    },
    custom: {
      title: "បន្ថែមមុខទំនិញថ្មី",
      alert: "មុខទំនិញថ្មីនេះនឹងត្រូវបានបន្ថែមចូលក្នុងបញ្ជីបច្ចុប្បន្ន ហើយអាចបញ្ជាទិញបានភ្លាមៗ។",
      enName: "ឈ្មោះអង់គ្លេស",
      khName: "ឈ្មោះខ្មែរ",
      category: "ប្រភេទ",
      defaultUnit: "ខ្នាតលំនាំដើម",
      priceUnit: "តម្លៃប៉ាន់ស្មានក្នុងមួយខ្នាត ($)",
      createOrder: "បង្កើត និងបញ្ជាទិញ",
    },
    review: {
      title: "ពិនិត្យបញ្ជីទំនិញ",
      sentTitle: "បញ្ជីទំនិញត្រូវបានបញ្ជូន!",
      sentSub: "បញ្ជីទំនិញរបស់អ្នកត្រូវបានបញ្ជូនទៅកាន់អ្នកគ្រប់គ្រង និងអ្នកផ្គត់ផ្គង់ហើយ (មិនបាច់ព្រីន)",
      redirecting: "⚡ កំពុងបញ្ជូនទៅកាន់ទំព័របញ្ជីបញ្ជាទិញ...",
      targetDate: "កាលបរិច្ឆេទដឹកជញ្ជូន",
      priority: "អាទិភាព",
      priorityNormal: "ធម្មតា (ដឹកជញ្ជូនពេលព្រឹក)",
      priorityUrgent: "🚨 បន្ទាន់ (ត្រូវការជាប្រញាប់)",
      priorityScheduled: "តាមកាលវិភាគ (កាលបរិច្ឆេទជាក់លាក់)",
      selectedItems: "មុខទំនិញដែលបានជ្រើសរើស",
      lineTotal: "តម្លៃសរុប",
      totalCost: "តម្លៃប៉ាន់ស្មានសរុប",
      totalCostSub: "តម្លៃប៉ាន់ស្មានសរុបប្រចាំថ្ងៃ",
      confirmSend: "បញ្ជាក់ និងបញ្ជូនបញ្ជី",
      routing: "កំពុងបញ្ជូន...",
    },
    orders: {
      title: "បញ្ជីសំណូមពរទិញទំនិញ និងផ្សារ",
      subtitle: "គ្រប់គ្រងសំណូមពរទិញទំនិញប្រចាំថ្ងៃ បញ្ជាទិញ និងការទទួលទំនិញ",
      newRequest: "+ បង្ហោះការបញ្ជាទិញ",
      filterAll: "ទាំងអស់",
      filterPending: "រង់ចាំពិនិត្យ",
      filterApproved: "បានយល់ព្រម",
      filterSent: "ផ្ញើទៅផ្សារ",
      filterDiscrepancy: "មានខ្វះខូច",
      filterCompleted: "បានទទួល",
    },
    finance: {
      title: "គ្រប់គ្រងចំណូល និងចំណាយ",
      subtitle: "តាមដានចំណូលលក់ប្រចាំថ្ងៃ ការចំណាយទិញទំនិញ និងលំហូរសាច់ប្រាក់សុទ្ធ",
      income: "ចំណូលសរុប",
      outcome: "ចំណាយសរុប",
      netFlow: "លំហូរសាច់ប្រាក់សុទ្ធ",
      recordSales: "+ កត់ត្រាចំណូលលក់",
      recordExpense: "+ កត់ត្រាចំណាយ",
      tabAll: "ប្រតិបត្តិការទាំងអស់",
      tabIncome: "ចំណូលតែប៉ុណ្ណោះ",
      tabOutcome: "ចំណាយតែប៉ុណ្ណោះ",
      monthlyReport: "របាយការណ៍ហិរញ្ញវត្ថុប្រចាំខែ",
      todayCash: "ស្ថានភាពសាច់ប្រាក់ថ្ងៃនេះ",
    },
  },
};
