import { ContactsModule } from "@/components/dashboard/ContactsModule";

const ContactsPage = () => {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          CRM Contacts
        </h1>
        <p className="text-muted-foreground">
          Gérez vos contacts et le mode Ghost sélectif
        </p>
      </div>

      <ContactsModule />
    </div>
  );
};

export default ContactsPage;