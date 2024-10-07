"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Download } from "lucide-react";

const Plus = ({ className = "" }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    className={`${className}`}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const XIcon = ({ className = "" }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    className={`${className}`}
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

interface Contact {
  id: number;
  name: string;
  phone: string;
}

export default function Page() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [csvData, setCsvData] = useState("");
  const [viewmode, setViewmode] = useState("individual");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // default phone
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatPhoneNumber = (phoneNumberString: string) => {
    const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return match[1] + "-" + match[2] + "-" + match[3];
    }
    return phoneNumberString;
  };

  const isValidPhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    return cleaned.length === 10;
  };

  const isDuplicate = (newName: string, newPhone: string) => {
    return contacts.some(
      (contact) =>
        contact.name.toLowerCase() === newName.toLowerCase() &&
        contact.phone.replace(/\D/g, "") === newPhone.replace(/\D/g, "")
    );
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && phone) {
      if (!isValidPhoneNumber(phone)) {
        toast.error("Invalid phone number. Please enter a 10-digit number.");
        return;
      }
      const formattedPhone = formatPhoneNumber(phone);
      if (isDuplicate(name, formattedPhone)) {
        toast.error("Duplicate contact. This name and number already exist.");
        return;
      }
      setContacts([
        ...contacts,
        { id: Date.now(), name, phone: formattedPhone },
      ]);
      setName("");
      setPhone("");
    }
  };

  const removeContact = (id: number) => {
    setContacts(contacts.filter((contact) => contact.id !== id));
  };

  const processCSV = () => {
    const lines = csvData.split("\n");
    const newContacts = lines
      .map((line) => {
        const [name, phone] = line.split(",");
        const trimmedPhone = phone.trim();
        if (!isValidPhoneNumber(trimmedPhone)) {
          toast.error(
            `Invalid phone number for ${name.trim()}: ${trimmedPhone}`
          );
          return null;
        }
        const formattedPhone = formatPhoneNumber(trimmedPhone);
        return {
          id: Date.now() + Math.random(),
          name: name.trim(),
          phone: formattedPhone,
        };
      })
      .filter(
        (contact): contact is Contact =>
          contact !== null && !!contact.name && !!contact.phone
      );

    const uniqueNewContacts = newContacts.filter(
      (newContact) => !isDuplicate(newContact.name, newContact.phone)
    );

    if (uniqueNewContacts.length < newContacts.length) {
      toast.warning("Some duplicate contacts were skipped.");
    }

    setContacts([...contacts, ...uniqueNewContacts]);
    setCsvData("");
  };

  const processImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("No file selected. Please choose an image.");
      return;
    }

    try {
      const base64Image = await convertToBase64(file);
      const response = await fetch("/api/process-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          prompt: `Analyze the screenshot provided and identify all unsaved phone numbers. For each number, attempt to determine the corresponding name based on the context of the screenshot. If a name is associated with a number, output the following: Name, {Number formatted in XXX-XXX-XXXX}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Image processing failed");
      }

      const data = await response.json();
      const newContacts = parseApiOutput(data.output);
      const uniqueNewContacts = newContacts.filter(
        (newContact) => !isDuplicate(newContact.name, newContact.phone)
      );

      if (uniqueNewContacts.length < newContacts.length) {
        toast.warning("Some duplicate contacts were skipped.");
      }

      setContacts([...contacts, ...uniqueNewContacts]);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Error processing image. Please try again.");
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => {
        console.error("Error converting file to base64:", error);
        reject(error);
      };
    });
  };

  const parseApiOutput = (output: string): Contact[] => {
    const lines = output.split("\n");
    return lines
      .map((line) => {
        const [name, phone] = line.split(", ");

        // Ensure both name and phone are defined before proceeding
        if (!name || !phone) {
          toast.error("Invalid contact format. Skipping.");
          return null;
        }

        const trimmedPhone = phone.trim();

        if (!isValidPhoneNumber(trimmedPhone)) {
          toast.error(
            `Invalid phone number for ${name.trim()}: ${trimmedPhone}`
          );
          return null;
        }

        return {
          id: Date.now() + Math.random(),
          name: name.trim(),
          phone: formatPhoneNumber(trimmedPhone),
        };
      })
      .filter(
        (contact): contact is Contact =>
          contact !== null && !!contact.name && !!contact.phone
      );
  };

  const generateVCF = () => {
    if (isMobile) {
      contacts.forEach((contact) => {
        const vcfContent = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL;TYPE=CELL:${contact.phone}
END:VCARD`;

        const blob = new Blob([vcfContent], { type: "text/vcard" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${contact.name}.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
      toast.success("Individual contact files downloaded");
    } else {
      let vcfContent = "";
      contacts.forEach((contact) => {
        vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL;TYPE=CELL:${contact.phone}
END:VCARD
`;
      });

      const blob = new Blob([vcfContent], { type: "text/vcard" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "contacts.vcf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const removeAllContacts = () => {
    setContacts([]);
    toast.success("All contacts removed");
  };

  return (
    <div>
      <main className="antialiased min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
        <div className="relative w-full">
          <div
            className="pointer-events-none absolute left-1/2 top-0 z-0 h-[400px] w-full max-w-[1000px] -translate-x-1/2 -translate-y-1/2 opacity-[0.15]"
            style={{
              backgroundImage: "radial-gradient(#A4A4A3, transparent 50%)",
            }}
          ></div>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full stroke-gray-400/80 opacity-50 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
                width="200"
                height="200"
                x="50%"
                y="-1"
                patternUnits="userSpaceOnUse"
              >
                <path d="M100 200V.5M.5 .5H200" fill="none"></path>
              </pattern>
            </defs>
            <svg x="50%" y="-1" className="overflow-visible fill-gray-50">
              <path
                d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
                strokeWidth={0}
              ></path>
            </svg>
            <rect
              width="100%"
              height="100%"
              strokeWidth={0}
              fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)"
            ></rect>
          </svg>
          <div className="mx-auto max-w-3xl pt-16 sm:pt-24 lg:pt-56 px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-5xl font-semibold mb-4">
                Create{" "}
                <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 text-transparent bg-clip-text">
                  multiple
                </span>{" "}
                contacts in just{" "}
                <span className="bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 text-transparent bg-clip-text">
                  one click
                </span>
                .
              </h1>
              <p className="text-lg sm:text-xl font-[350] max-w-xl mx-auto text-center text-gray-600">
                Just got added to a groupchat and don&apos;t have anyone&apos;s
                contact saved? Use this quick tool to easily get everyone&apos;s
                contact added in one-go.
                <br />
                <span className="font-medium">Note:</span> Currently only tested
                on MacOS.
              </p>
            </div>
            <div className="mt-4 mb-8 mx-8 text-center max-w-2xl">
              <Tabs
                value={viewmode}
                onValueChange={setViewmode}
                className="mb-4"
              >
                <TabsList>
                  <TabsTrigger value="individual" className="text-md">
                    Individual
                  </TabsTrigger>
                  <TabsTrigger value="spreadsheet" className="text-md">
                    Spreadsheet
                  </TabsTrigger>
                  <TabsTrigger value="image" className="text-md">
                    Screenshot
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="individual">
                  <form onSubmit={addContact} className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <Button type="submit" className="h-10 w-full">
                      <Plus className="mr-2 h-4 w-4" /> Add Contact
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="spreadsheet">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Paste data here in the following format: Name, Phone"
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      rows={5}
                    />
                    <Button onClick={processCSV} className="h-10 w-full">
                      <Plus className="mr-2 h-4 w-4" /> Process Spreadsheet
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="image">
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={processImage}
                      className="file:mr-4 file:py-2 file:px-4 h-[11.5] file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    <p className="text-sm text-center text-muted-foreground">
                      Upload a screenshot of contacts to process
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="mb-4">
                <h2 className="text-xl text-center font-semibold mb-2">
                  {viewmode === "individual"
                    ? "Current contacts:"
                    : "Processed contacts:"}
                </h2>
                <ul className="space-y-2">
                  {contacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="flex justify-between items-center bg-muted shadow p-2 rounded"
                    >
                      <span className="truncate mr-2">
                        {contact.name}: {contact.phone}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              {contacts.length > 0 && (
                <div className="space-y-2">
                  <Button onClick={removeAllContacts} className="h-10 w-full">
                    <XIcon className="mr-2 h-4 w-4" /> Remove All Contacts
                  </Button>
                  <Button onClick={generateVCF} className="h-10 w-full">
                    <Download className="mr-2 h-4 w-4" />{" "}
                    {isMobile
                      ? "Download Individual Contacts"
                      : "Download All Contacts"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* <footer className="flex justify-center pt-20 pb-10 bg-gray-50">
        <h3 className="text-gray-600 font-light text-base cursor-default">
          hacked together with <span className="hover:text-rose-400">♡</span> by
          <a
            className="underline text-rose-400 text-base hover:text-rose-400/60"
            href="https://saurish.com/"
          >
            saurish
          </a>{" "}
          <a
            className="underline text-rose-400 text-base hover:text-rose-400/60"
            href="https://github.com/minor/fluff-detector/"
          >
            how it works
          </a>
        </h3>
      </footer> */}
    </div>
  );
}
