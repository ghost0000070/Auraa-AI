import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do Auraa AI employees differ from standard chatbots?",
    answer: "Standard chatbots follow simple scripts. Auraa AI employees are autonomous agents powered by advanced LLMs. They understand context, can execute complex workflows (like updating CRMs or writing code), and adapt to your specific brand voice and business rules."
  },
  {
    question: "Can I integrate Auraa with my existing tools?",
    answer: "Yes! Auraa is designed to integrate seamlessly with your tech stack. We support integrations with popular platforms like Slack, Gmail, HubSpot, Salesforce, and more. You can also use our API for custom integrations."
  },
  {
    question: "Is my data secure?",
    answer: "Security is our top priority. We use enterprise-grade encryption for all data in transit and at rest. Your business data is isolated and never used to train our global models without your explicit permission."
  },
  {
    question: "How long does it take to train an AI employee?",
    answer: "Most of our pre-built templates (like Sales or Support agents) work out of the box. Customizing them with your specific knowledge base usually takes just a few minutes of uploading documents or providing a website URL."
  },
  {
    question: "Can I upgrade or downgrade my plan later?",
    answer: "Absolutely. You can adjust your subscription tier at any time from your dashboard as your business needs change. Changes take effect immediately."
  }
];

export const FAQSection = () => {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Subtle Glow */}
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-400">
            Everything you need to know about the Auraa AI platform.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border border-white/10 bg-slate-900/40 backdrop-blur-sm rounded-lg px-4 data-[state=open]:border-primary/50 transition-colors duration-200">
              <AccordionTrigger className="text-left text-lg font-medium text-slate-200 hover:text-primary hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-400 leading-relaxed pb-6 text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
