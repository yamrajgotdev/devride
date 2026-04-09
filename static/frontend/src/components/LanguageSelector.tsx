import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const translations = {
  en: {
    appTagline: "Your ride, your way",
    passenger: "Passenger",
    passengerSub: "Book a ride",
    driver: "Driver",
    driverSub: "Start earning",
    safeRides: "Safe rides",
    topRated: "Top rated",
    fastBooking: "Fast booking",
    history: "History",
    liveMap: "Live Map",
    navReady: "Navigation ready",
    bookRide: "Book a Ride",
    scheduleRide: "Schedule",
    pickupLocation: "Pickup location",
    dropLocation: "Drop location",
    date: "Date",
    time: "Time",
    chooseVehicle: "Choose Vehicle",
    enterPromo: "Promo code",
    applyPromo: "Apply",
    distance: "Distance",
    estFare: "Est. Fare",
    eta: "ETA",
    requestRide: "Request Ride",
    safetyFirst: "Safety First",
    safetyDesc: "All rides are GPS tracked with 24/7 support",
    rideStatus: "Ride Status",
    searchingDrivers: "Searching nearby drivers...",
    driverFound: "Driver Found",
    driverLabel: "Driver",
    vehicle: "Vehicle",
    phone: "Phone",
    fare: "Fare",
    quickActions: "Quick Actions",
    savedPlaces: "Saved Places",
    rideHistory: "Ride History",
    paymentMethods: "Payment",
    support: "Support",
    changeLanguage: "Language",
    online: "Online",
    offline: "Offline",
    welcomeDriver: "Welcome, Driver",
    readyToDrive: "Ready to hit the road?",
    todaysEarnings: "Today's Earnings",
    tripsToday: "Trips Today",
    totalDistance: "Total Distance",
    newRideRequest: "New Ride Request",
    acceptRide: "Accept",
    rejectRide: "Decline",
    driverControls: "Driver Controls",
    earnings: "Earnings",
    navigation: "Navigation",
    settings: "Settings",
    goBack: "Go back",
    passengerLogin: "Passenger Login",
    mobileNumber: "Mobile Number",
    enterMobile: "Enter mobile number",
    username: "Username",
    enterUsername: "Enter your name",
    emailOptional: "Email",
    enterEmail: "Enter email",
    getOtp: "Get OTP",
    otpVerification: "OTP Verification",
    enterOtp: "Enter the code sent to",
    verifyOtp: "Verify & Continue",
    resendIn: "Resend in",
    resendOtp: "Resend OTP",
    driverRegistration: "Driver Registration",
    driverRegSubtitle: "Complete your profile to start driving",
    personalInfo: "Personal Information",
    fullName: "Full Name",
    enterFullName: "Enter full name",
    documentDetails: "Document Details",
    aadhaarNumber: "Aadhaar Number",
    invalidAadhaar: "Enter valid 12-digit Aadhaar",
    panNumber: "PAN Number",
    invalidPan: "Enter valid PAN (e.g. ABCDE1234F)",
    rcNumber: "RC Number",
    enterRcNumber: "Enter RC number",
    numberPlate: "Number Plate",
    invalidPlate: "Enter valid plate (e.g. MH01AB1234)",
    invalidMobile: "Enter a valid 10-digit mobile number",
    uploadDocuments: "Upload Documents",
    uploadPanCard: "PAN Card",
    uploadAadhaar: "Aadhaar Card",
    uploadRc: "Registration Certificate",
    uploadDrivingLicense: "Driving License",
    tapToUpload: "Tap to upload",
    uploaded: "Done",
    agreeToTerms: "I agree to the",
    termsAndConditions: "Terms & Conditions",
    termsTitle: "Terms & Conditions",
    acceptTerms: "I Accept",
    registerDriver: "Register as Driver",
    verificationPending: "Verification Pending",
    verificationMsg: "Your documents are being reviewed. You'll be notified once approved.",
    verificationNote: "This usually takes 24-48 hours.",
    mobileVerified: "Mobile Verified",
    docsSubmitted: "Documents Submitted",
    docsCount: "4 documents uploaded",
    backToHome: "Back to Home",
    rideBooked: "Ride Booked!",
    rideConfirmed: "Your ride has been confirmed",
    estArrival: "ETA",
    fareBreakdown: "Fare Breakdown",
    baseFare: "Base Fare",
    distanceCharge: "Distance",
    taxes: "Taxes & Fees",
    totalFare: "Total",
    trackRide: "Track Ride",
    rateFeedback: "Rate & Feedback",
    cancelRide: "Cancel Ride",
    shareRide: "Share",
    sos: "SOS",
    rideCancelled: "Ride Cancelled",
    rideCancelledMsg: "Your ride has been cancelled successfully.",
    cancelRideTitle: "Cancel Ride",
    cancelReason: "Please select a reason",
    reasonChanged: "Changed my mind",
    reasonWaiting: "Driver taking too long",
    reasonWrongPickup: "Wrong pickup location",
    reasonOther: "Other reason",
    confirmCancel: "Confirm Cancel",
    thanksFeedback: "Thank You!",
    feedbackMsg: "Your feedback helps us improve.",
    howWasRide: "How was your ride?",
    leaveComment: "Leave a comment (optional)",
    submitFeedback: "Submit Feedback",
    contactUs: "Contact",
    callUs: "Call Us",
    emailUs: "Email Us",
    drivingLicenseNumber: "Driving License Number",
    enterDrivingLicense: "Enter DL number",
    invalidDrivingLicense: "Enter valid DL number",
  },
  hi: {
    appTagline: "आपकी सवारी, आपका तरीका",
    passenger: "यात्री",
    passengerSub: "सवारी बुक करें",
    driver: "ड्राइवर",
    driverSub: "कमाई शुरू करें",
    safeRides: "सुरक्षित सवारी",
    topRated: "टॉप रेटेड",
    fastBooking: "तेज़ बुकिंग",
    history: "इतिहास",
    liveMap: "लाइव मैप",
    navReady: "नेविगेशन तैयार",
    bookRide: "सवारी बुक करें",
    scheduleRide: "शेड्यूल",
    pickupLocation: "पिकअप स्थान",
    dropLocation: "ड्रॉप स्थान",
    date: "तारीख",
    time: "समय",
    chooseVehicle: "वाहन चुनें",
    enterPromo: "प्रोमो कोड",
    applyPromo: "लागू करें",
    distance: "दूरी",
    estFare: "अनुमानित किराया",
    eta: "ETA",
    requestRide: "सवारी अनुरोध",
    safetyFirst: "सुरक्षा सबसे पहले",
    safetyDesc: "सभी सवारी GPS ट्रैक्ड हैं",
    rideStatus: "सवारी स्थिति",
    searchingDrivers: "ड्राइवर खोज रहे हैं...",
    driverFound: "ड्राइवर मिला",
    driverLabel: "ड्राइवर",
    vehicle: "वाहन",
    phone: "फ़ोन",
    fare: "किराया",
    quickActions: "त्वरित कार्य",
    savedPlaces: "सहेजे गए स्थान",
    rideHistory: "सवारी इतिहास",
    paymentMethods: "भुगतान",
    support: "सहायता",
    changeLanguage: "भाषा",
    online: "ऑनलाइन",
    offline: "ऑफलाइन",
    welcomeDriver: "स्वागत है, ड्राइवर",
    readyToDrive: "सड़क पर चलने के लिए तैयार?",
    todaysEarnings: "आज की कमाई",
    tripsToday: "आज की यात्राएं",
    totalDistance: "कुल दूरी",
    newRideRequest: "नई सवारी अनुरोध",
    acceptRide: "स्वीकार",
    rejectRide: "अस्वीकार",
    driverControls: "ड्राइवर नियंत्रण",
    earnings: "कमाई",
    navigation: "नेविगेशन",
    settings: "सेटिंग्स",
    goBack: "वापस जाएं",
    passengerLogin: "यात्री लॉगिन",
    mobileNumber: "मोबाइल नंबर",
    enterMobile: "मोबाइल नंबर दर्ज करें",
    username: "उपयोगकर्ता नाम",
    enterUsername: "अपना नाम दर्ज करें",
    emailOptional: "ईमेल",
    enterEmail: "ईमेल दर्ज करें",
    getOtp: "OTP प्राप्त करें",
    otpVerification: "OTP सत्यापन",
    enterOtp: "कोड दर्ज करें",
    verifyOtp: "सत्यापित करें",
    resendIn: "पुन: भेजें",
    resendOtp: "OTP पुन: भेजें",
    driverRegistration: "ड्राइवर पंजीकरण",
    driverRegSubtitle: "ड्राइविंग शुरू करने के लिए प्रोफ़ाइल पूरा करें",
    personalInfo: "व्यक्तिगत जानकारी",
    fullName: "पूरा नाम",
    enterFullName: "पूरा नाम दर्ज करें",
    documentDetails: "दस्तावेज़ विवरण",
    aadhaarNumber: "आधार नंबर",
    invalidAadhaar: "मान्य 12 अंकों का आधार दर्ज करें",
    panNumber: "PAN नंबर",
    invalidPan: "मान्य PAN दर्ज करें",
    rcNumber: "RC नंबर",
    enterRcNumber: "RC नंबर दर्ज करें",
    numberPlate: "नंबर प्लेट",
    invalidPlate: "मान्य नंबर प्लेट दर्ज करें",
    invalidMobile: "मान्य 10 अंकों का मोबाइल नंबर दर्ज करें",
    uploadDocuments: "दस्तावेज़ अपलोड करें",
    uploadPanCard: "PAN कार्ड",
    uploadAadhaar: "आधार कार्ड",
    uploadRc: "पंजीकरण प्रमाणपत्र",
    uploadDrivingLicense: "ड्राइविंग लाइसेंस",
    tapToUpload: "अपलोड करें",
    uploaded: "हो गया",
    agreeToTerms: "मैं सहमत हूं",
    termsAndConditions: "नियम और शर्तें",
    termsTitle: "नियम और शर्तें",
    acceptTerms: "स्वीकार करें",
    registerDriver: "ड्राइवर के रूप में पंजीकरण",
    verificationPending: "सत्यापन लंबित",
    verificationMsg: "आपके दस्तावेज़ की समीक्षा की जा रही है।",
    verificationNote: "इसमें 24-48 घंटे लग सकते हैं।",
    mobileVerified: "मोबाइल सत्यापित",
    docsSubmitted: "दस्तावेज़ जमा किए गए",
    docsCount: "4 दस्तावेज़ अपलोड किए गए",
    backToHome: "होम पर वापस",
    rideBooked: "सवारी बुक हो गई!",
    rideConfirmed: "आपकी सवारी की पुष्टि हो गई",
    estArrival: "ETA",
    fareBreakdown: "किराया विवरण",
    baseFare: "बेस किराया",
    distanceCharge: "दूरी",
    taxes: "कर और शुल्क",
    totalFare: "कुल",
    trackRide: "सवारी ट्रैक करें",
    rateFeedback: "रेटिंग और फीडबैक",
    cancelRide: "सवारी रद्द करें",
    shareRide: "शेयर",
    sos: "SOS",
    rideCancelled: "सवारी रद्द",
    rideCancelledMsg: "आपकी सवारी सफलतापूर्वक रद्द कर दी गई।",
    cancelRideTitle: "सवारी रद्द करें",
    cancelReason: "कृपया एक कारण चुनें",
    reasonChanged: "मन बदल गया",
    reasonWaiting: "ड्राइवर को बहुत समय लग रहा",
    reasonWrongPickup: "गलत पिकअप स्थान",
    reasonOther: "अन्य कारण",
    confirmCancel: "रद्द करें",
    thanksFeedback: "धन्यवाद!",
    feedbackMsg: "आपका फीडबैक हमें सुधार करने में मदद करता है।",
    howWasRide: "आपकी सवारी कैसी रही?",
    leaveComment: "टिप्पणी छोड़ें (वैकल्पिक)",
    submitFeedback: "फीडबैक भेजें",
    contactUs: "संपर्क",
    callUs: "कॉल करें",
    emailUs: "ईमेल करें",
    drivingLicenseNumber: "ड्राइविंग लाइसेंस नंबर",
    enterDrivingLicense: "DL नंबर दर्ज करें",
    invalidDrivingLicense: "मान्य DL नंबर दर्ज करें",
  },
};

type Lang = "en" | "hi";
type Translations = typeof translations.en;

interface LanguageContextType {
  t: Translations;
  lang: Lang;
  setLang: (l: Lang) => void;
  showSelector: boolean;
  selectLanguage: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("ridego-lang");
    return (saved === "hi" ? "hi" : "en") as Lang;
  });
  const [showSelector, setShowSelector] = useState(() => !localStorage.getItem("ridego-lang"));

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("ridego-lang", l);
  };

  const selectLanguage = (l: Lang) => {
    setLang(l);
    setShowSelector(false);
  };

  return (
    <LanguageContext.Provider value={{ t: translations[lang], lang, setLang, showSelector, selectLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

export const LanguageModal = ({ onSelect }: { onSelect: (l: Lang) => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm animate-in fade-in">
    <div className="bg-background rounded-3xl p-8 w-full max-w-sm space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
      <h2 className="text-xl font-bold text-center text-foreground">Choose Language</h2>
      <div className="space-y-3">
        <button onClick={() => onSelect("en")} className="w-full py-4 rounded-xl border border-border hover:border-foreground/30 text-left px-6 transition-all hover:bg-secondary">
          <p className="font-semibold">English</p>
          <p className="text-xs text-muted-foreground">Continue in English</p>
        </button>
        <button onClick={() => onSelect("hi")} className="w-full py-4 rounded-xl border border-border hover:border-foreground/30 text-left px-6 transition-all hover:bg-secondary">
          <p className="font-semibold">हिन्दी</p>
          <p className="text-xs text-muted-foreground">हिन्दी में जारी रखें</p>
        </button>
      </div>
    </div>
  </div>
);
