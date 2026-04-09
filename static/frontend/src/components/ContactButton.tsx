import { useState } from "react";
import { Phone, Mail, MessageCircle, X } from "lucide-react";

interface ContactButtonProps {
  t: {
    contactUs: string;
    callUs: string;
    emailUs: string;
  };
}

const ContactButton = ({ t }: ContactButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="mb-3 bg-background border border-border rounded-2xl shadow-lg p-4 space-y-3 animate-in slide-in-from-bottom-2 w-56">
          <a href="tel:+911234567890" className="flex items-center gap-3 text-sm hover:text-foreground text-muted-foreground transition-colors">
            <Phone className="w-4 h-4" /> {t.callUs}
          </a>
          <a href="mailto:support@ridego.in" className="flex items-center gap-3 text-sm hover:text-foreground text-muted-foreground transition-colors">
            <Mail className="w-4 h-4" /> {t.emailUs}
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default ContactButton;
