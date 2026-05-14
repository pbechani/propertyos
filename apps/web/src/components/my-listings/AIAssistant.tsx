'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Mail, FileText, TrendingUp, MessageSquare, Zap, ChevronDown, Copy, Check, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  category: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'description',
    label: 'Generate Listing Description',
    icon: <FileText className="w-4 h-4" />,
    prompt: 'Write a compelling MLS listing description for this property.',
    category: 'Marketing'
  },
  {
    id: 'email-enquiry',
    label: 'Draft Enquiry Response',
    icon: <Mail className="w-4 h-4" />,
    prompt: 'Draft a professional response to the latest buyer enquiry about this property.',
    category: 'Communication'
  },
  {
    id: 'social-post',
    label: 'Create Social Media Post',
    icon: <MessageSquare className="w-4 h-4" />,
    prompt: 'Write an engaging social media post to promote this listing.',
    category: 'Marketing'
  },
  {
    id: 'pricing-analysis',
    label: 'Pricing Strategy Analysis',
    icon: <TrendingUp className="w-4 h-4" />,
    prompt: 'Analyze the current pricing strategy for this property based on market data.',
    category: 'Strategy'
  },
  {
    id: 'showing-summary',
    label: 'Summarize Showing Feedback',
    icon: <Sparkles className="w-4 h-4" />,
    prompt: 'Summarize all the showing feedback and identify common themes.',
    category: 'Analysis'
  },
  {
    id: 'next-steps',
    label: 'Recommended Next Steps',
    icon: <Zap className="w-4 h-4" />,
    prompt: 'Based on the current listing status, what should I focus on next?',
    category: 'Strategy'
  }
];

const mockResponses: Record<string, string> = {
  'description': `**Stunning Modern Retreat in Coveted Westwood**

Welcome to 2847 Westwood Boulevard — a beautifully updated 4-bedroom, 3-bathroom single-family home offering 2,450 sq ft of refined living space in one of LA's most desirable neighborhoods.

Step inside to discover a gourmet kitchen with quartz countertops, custom cabinetry, and stainless steel appliances — fully renovated in 2025. The open-concept living area flows seamlessly to a private backyard oasis featuring a composite deck, built-in BBQ, and mature landscaping.

**Key Highlights:**
• Brand-new HVAC system (2024) for year-round comfort
• Solar panels & double-pane windows for energy efficiency
• Smart home integration: Nest, Ring, smart lighting & security
• Hardwood floors throughout the main level
• Walk-in closets in every bedroom
• Top-rated Westwood schools within walking distance

Minutes from UCLA, Westwood Village, and major freeways. This turnkey home is perfect for families seeking style, convenience, and modern comfort.

Listed at $825,000 | MLS# SR24087523`,

  'email-enquiry': `Subject: Re: Inquiry About 2847 Westwood Boulevard

Hi Jessica,

Thank you for your interest in 2847 Westwood Boulevard! The property is absolutely still available, and I'd love to arrange a viewing for you.

I have several weekend slots available:
• Saturday, March 21 at 10:00 AM or 2:00 PM
• Sunday, March 22 at 11:00 AM or 3:00 PM

The home features a recently renovated kitchen, new HVAC system, and a beautiful backyard — I think you'll be very impressed in person.

Would any of these times work for you? If not, I'm happy to find an alternative that fits your schedule.

Looking forward to hearing from you!

Best regards,
John Doe
Premium Realty Group
(555) 555-0100`,

  'social-post': `🏡 Just Listed in Westwood! 

4 BD | 3 BA | 2,450 SF | $825,000

This stunning modern home at 2847 Westwood Blvd checks every box:

✨ Fully renovated gourmet kitchen (2025)
🌿 Private backyard with composite deck & built-in BBQ
🔋 Solar panels + brand-new HVAC = ultra-low utility bills
🏫 Walking distance to top-rated schools
🏠 Smart home ready with Nest, Ring & integrated security

Move-in ready and beautifully maintained — this one won't last!

📩 DM for details or to schedule a private tour.

#WestwoodRealEstate #JustListed #LAHomes #DreamHome #LuxuryLiving #OpenHouse #RealEstate #ModernHome`,

  'pricing-analysis': `**Pricing Strategy Analysis — 2847 Westwood Blvd**

**Current Position:**
• List Price: $825,000
• Days on Market: 28 days
• Comparable Range: $790,000–$850,000

**Market Assessment:**
Your pricing is well-positioned in the upper-middle of the comp range, which is justified by the recent renovations ($85k+ in upgrades). Here's the breakdown:

**Strengths Supporting Current Price:**
1. Kitchen renovation ($45k) — adds $50-60k perceived value
2. New HVAC ($12k) — removes a common negotiation point
3. Updated bathrooms ($28k) — move-in ready appeal
4. Prime Westwood location with top school district

**Concerning Signals:**
1. 28 DOM is approaching the 30-day threshold where buyer perception shifts
2. Highest offer received is $810k (98.2% of asking)
3. Some showing feedback mentions price concern

**Recommendation:**
Hold the current price for another 7-10 days. You have a strong pending offer at $810k and active interest from 2 hot leads. If no acceptable offer materializes by Day 38, consider a strategic $10k reduction to $815,000 to refresh visibility and trigger new buyer alerts.

**Expected Outcome:** 85% probability of closing at $810-820k within the next 3 weeks based on current pipeline.`,

  'showing-summary': `**Showing Feedback Summary — 2847 Westwood Blvd**
*Based on 46 total showings over 4 weeks*

**Top Positive Themes:**
1. **Kitchen** (mentioned 38/46 showings) — Consistently the #1 highlight. Buyers love the quartz countertops, island, and modern appliances.
2. **Outdoor Space** (32/46) — The deck, BBQ area, and mature landscaping are frequently praised.
3. **Location** (29/46) — Proximity to schools, UCLA, and Westwood Village is a major draw.
4. **Move-in Ready** (25/46) — Buyers appreciate the updated condition throughout.

**Top Concerns:**
1. **Street Noise** (12/46 showings, 26%) — Some buyers note the busy street. *Mitigation: Emphasize the double-pane windows and sound insulation in your pitch.*
2. **Price** (8/46 showings, 17%) — A segment of buyers feel it's at the top of the range. However, these tend to be less serious buyers.
3. **Garage Size** (5/46) — A few buyers wished for a larger garage.

**Buyer Interest Breakdown:**
• Very Interested: 45% (21 parties)
• Somewhat Interested: 30% (14 parties)
• Not Interested: 15% (7 parties)
• No Feedback: 10% (4 parties)

**Key Insight:** Your conversion from showing to serious interest (75%) is well above the market average of 55%. The property is showing very well — the data suggests a sale is imminent.`,

  'next-steps': `**Recommended Next Steps — Priority Action Plan**

Based on your current listing status, here's what needs your attention:

🔴 **URGENT (Today)**
1. **Review Jennifer Martinez's $810k offer** — This is your strongest offer at 98.2% of asking. She's pre-approved with a conventional loan. Consider countering at $818k to meet in the middle.
2. **Respond to 3 pending viewing requests** — Michael Chen, Emily Rodriguez, and Lisa Anderson are all waiting for confirmation. Delay risks losing interested buyers.
3. **Reply to Jessica Martin's enquiry** — New enquiry from today, interested in weekend viewing.

🟡 **THIS WEEK**
4. **Follow up with Alex Thompson's counter** — You countered at $815k. It's been 3 days without a response. A gentle follow-up call could keep negotiations alive.
5. **Prepare for next Open House (March 22)** — Marketing materials need refresh with showing feedback highlights.
6. **Contact Kevin Patel (warm lead)** — First-time buyer working on financing. Check if he's made progress on pre-approval.

🟢 **STRATEGIC**
7. **Update listing photos** — Current photos are from listing day. Consider adding lifestyle shots of the backyard/deck for spring appeal.
8. **Address street noise concern** — Add mention of double-pane windows and sound insulation score to listing description.
9. **Prepare negotiation strategy** — With the appraisal scheduled for March 25, prepare comps documentation to support your pricing.

**Bottom Line:** You're in a strong position with multiple interested buyers. Focus on closing the Martinez offer while keeping your pipeline warm. The property's 75% interest rate from showings is exceptional.`
};

interface ListingContext {
  address: string;
  agentFirstName: string;
  agentFullName: string;
  price?: number;
  currency?: string;
  beds?: number;
  baths?: number;
  areaSqm?: number;
  status?: string;
  daysOnMarket?: number;
  viewings?: number;
  leads?: number;
  enquiries?: number;
}

function buildListingResponse(actionId: string, l: ListingContext): string | null {
  const fmt = (n: number) => n.toLocaleString();
  const priceStr = l.price
    ? new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: l.currency ?? 'ZAR',
        maximumFractionDigits: 0,
      }).format(l.price)
    : null;
  const specLine = [
    l.beds    && `${l.beds} Bed`,
    l.baths   && `${l.baths} Bath`,
    l.areaSqm && `${fmt(l.areaSqm)} m²`,
    priceStr,
  ].filter(Boolean).join(' | ');
  const dom      = l.daysOnMarket ?? 0;
  const views    = l.viewings    ?? 0;
  const leads    = l.leads       ?? 0;
  const enquiries = l.enquiries  ?? 0;

  switch (actionId) {
    case 'description':
      return [
        `**Well-Presented Property — ${l.address}**`,
        '',
        `Presenting ${l.address}${l.beds ? ` — a ${l.beds}-bedroom, ${l.baths ? `${l.baths}-bathroom ` : ''}home` : ''} in a highly sought-after location.`,
        '',
        'This property offers a thoughtful layout, quality finishes, and excellent access to local amenities — making it an outstanding choice for owner-occupiers and investors alike.',
        '',
        '**Key Highlights:**',
        '• Light-filled living spaces throughout',
        '• Well-appointed kitchen with quality appliances',
        '• Generous outdoor entertaining area',
        '• Secure parking and storage',
        '• Convenient access to schools, shops, and transport',
        priceStr ? `Asking price: **${priceStr}**` : null,
        l.areaSqm ? `Floor area: **${fmt(l.areaSqm)} m²**` : null,
        '',
        `Contact ${l.agentFullName} today to arrange a private viewing.`,
      ].filter(s => s !== null).join('\n');

    case 'email-enquiry':
      return [
        `Subject: Re: Your Enquiry About ${l.address}`,
        '',
        'Hi [Buyer Name],',
        '',
        `Thank you for your enquiry about ${l.address}! The property is still available and I'd love to arrange a viewing for you.`,
        '',
        'I currently have the following slots available:',
        '• This Saturday at 10:00 AM or 2:00 PM',
        '• This Sunday at 11:00 AM or 3:00 PM',
        '',
        views > 0 ? `The property has attracted strong interest with ${views} viewings to date — I recommend booking early.` : 'This is a great opportunity — I recommend booking a time to view it soon.',
        '',
        'Would any of these times suit you? If not, please let me know your preferred time and I will do my best to accommodate.',
        '',
        'Looking forward to showing you through.',
        '',
        `Kind regards,\n${l.agentFullName}`,
      ].join('\n');

    case 'social-post':
      return [
        `🏡 Just Listed — ${l.address}!`,
        specLine ? `\n${specLine}\n` : '',
        'This well-presented property is ready for its next owner:',
        '',
        '✨ Bright, spacious living areas',
        '🌿 Generous outdoor entertaining space',
        '🚗 Secure off-street parking',
        '📍 Excellent location close to schools, shops & transport',
        '',
        "Move-in ready — this one won't last!",
        '',
        '📩 DM or call to arrange your private inspection.',
        '',
        '#JustListed #RealEstate #PropertyForSale #NewListing',
      ].join('\n');

    case 'pricing-analysis':
      return [
        `**Pricing Strategy Analysis — ${l.address}**`,
        '',
        '**Current Position:**',
        priceStr ? `• List Price: ${priceStr}` : null,
        `• Days on Market: ${dom} day${dom !== 1 ? 's' : ''}`,
        `• Activity: ${views} viewing${views !== 1 ? 's' : ''}, ${enquiries} enquir${enquiries !== 1 ? 'ies' : 'y'}, ${leads} lead${leads !== 1 ? 's' : ''}`,
        '',
        '**Market Assessment:**',
        dom < 14
          ? `At only ${dom} days on market, the listing is within the prime visibility window. Focus on converting enquiries to viewings.`
          : dom < 30
            ? `At ${dom} days on market, the listing has had solid exposure. Review whether showing-to-lead conversion reflects genuine buyer intent.`
            : `At ${dom} days, consider refreshing pricing or marketing strategy to re-engage buyers and restore portal visibility.`,
        '',
        '**Activity Analysis:**',
        `1. **Enquiries (${enquiries})** — ${enquiries >= 5 ? 'Strong digital interest. Convert these to viewings.' : 'Boost online visibility to generate more enquiries.'}`,
        `2. **Viewings (${views})** — ${views >= 10 ? 'Good volume. Focus on converting to formal offers.' : 'Increase open house frequency to drive foot traffic.'}`,
        `3. **Active Leads (${leads})** — ${leads >= 3 ? 'Healthy pipeline. Follow up consistently.' : 'Build the lead base through proactive follow-up and open houses.'}`,
        '',
        '**Recommendation:**',
        dom < 21
          ? 'Maintain current pricing — the listing is active and gaining traction.'
          : `After ${dom} days, consider a targeted price adjustment or refreshed campaign to re-activate buyer interest.`,
      ].filter(s => s !== null).join('\n');

    case 'showing-summary':
      return [
        `**Showing Feedback Summary — ${l.address}**`,
        `*Based on ${views} viewing${views !== 1 ? 's' : ''} to date*`,
        '',
        '**Activity Snapshot:**',
        `• Total Viewings: ${views}`,
        `• Active Leads: ${leads}`,
        `• Enquiries Received: ${enquiries}`,
        `• Days on Market: ${dom}`,
        '',
        views >= 5
          ? `**Positive Signals:**\n1. ${views} viewings indicates solid buyer interest\n2. ${leads} active lead${leads !== 1 ? 's' : ''} provide a pipeline to progress\n3. Enquiry activity suggests good digital visibility`
          : `**Building Momentum:**\nWith ${views} viewing${views !== 1 ? 's' : ''} so far, focus on:\n1. Converting online enquiries (${enquiries}) into booked viewings\n2. Scheduling open houses to increase foot traffic\n3. Following up all enquiries within 24 hours`,
        '',
        '**Recommendation:**',
        leads > 0
          ? `Reach out to all ${leads} active lead${leads !== 1 ? 's' : ''} within 24 hours of their inspection.`
          : 'Focus on generating first viewings through targeted portal promotion and open houses.',
      ].join('\n');

    case 'next-steps':
      return [
        `**Recommended Next Steps — ${l.address}**`,
        '',
        `Current status: **${dom} day${dom !== 1 ? 's' : ''} on market** · ${views} viewing${views !== 1 ? 's' : ''} · ${leads} lead${leads !== 1 ? 's' : ''} · ${enquiries} enquir${enquiries !== 1 ? 'ies' : 'y'}`,
        '',
        '🔴 **URGENT**',
        `1. **Follow up active leads${leads > 0 ? ` (${leads} in pipeline)` : ''}** — Contact every lead within 24 hours.`,
        `2. **Confirm pending viewings${views > 0 ? ` (${views} total)` : ''}** — Unconfirmed inspections risk losing engaged buyers.`,
        enquiries > 0 ? `3. **Respond to enquiries (${enquiries})** — Aim for same-day responses.` : null,
        '',
        '🟡 **THIS WEEK**',
        dom > 14
          ? `• **Review marketing strategy** — At ${dom} days, consider refreshing photos, copy, or portal placement.`
          : '• **Maintain visibility** — Keep portal listings updated and promote on social media.',
        '• **Schedule next open house** — Regular open houses sustain foot traffic and generate new leads.',
        '• **Seller update** — Provide the vendor with a weekly activity report.',
        '',
        '🟢 **STRATEGIC**',
        '• **Comparable sales review** — Validate your pricing against recently sold and active listings.',
        '• **Build buyer urgency** — Communicate genuine interest from other parties to motivate serious enquirers.',
        '• **Prepare for negotiation** — Have comparable sales data ready to support your asking price.',
        '',
        '**Bottom Line:** ' + (views > 0 || leads > 0
          ? `With ${views} viewing${views !== 1 ? 's' : ''} and ${leads} active lead${leads !== 1 ? 's' : ''}, you have a pipeline to work from. Stay consistent and follow up promptly.`
          : 'Focus on generating early momentum — enquiries and viewings are the critical metrics right now.'),
      ].filter(s => s !== null).join('\n');

    default:
      return null;
  }
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  listing?: ListingContext;
}

export function AIAssistant({ isOpen, onClose, listing }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '0',
      role: 'assistant',
      content: listing
        ? `Hi ${listing.agentFirstName}! I'm your AI listing assistant for **${listing.address}**. I can help you draft communications, analyse market data, summarise feedback, and recommend next steps. What would you like help with?`
        : `Hi! I'm your AI listing assistant. I can help you draft communications, analyse market data, summarise feedback, and recommend next steps. What would you like help with?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const simulateResponse = (actionId?: string) => {
    setIsTyping(true);
    const delay = 1200 + Math.random() * 800;

    setTimeout(() => {
      if (!listing) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I\'m ready to help once the listing details have loaded. Please try again shortly.',
          timestamp: new Date()
        }]);
        setIsTyping(false);
        return;
      }

      const dom        = listing.daysOnMarket ?? 0;
      const views      = listing.viewings    ?? 0;
      const leads      = listing.leads       ?? 0;
      const enquiries  = listing.enquiries   ?? 0;
      const statusStr  = listing.status ? listing.status.replace(/_/g, ' ') : 'active';

      const fallback = `I've reviewed the current data for **${listing.address}**. Here's a quick summary:\n\n` +
        `1. **Activity** — ${views} viewing${views !== 1 ? 's' : ''}, ${enquiries} enquir${enquiries !== 1 ? 'ies' : 'y'}, ${leads} active lead${leads !== 1 ? 's' : ''}\n` +
        `2. **Time on market** — ${dom} day${dom !== 1 ? 's' : ''}\n` +
        `3. **Status** — ${statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}\n\n` +
        'Would you like me to dive deeper into any of these areas?';

      const responseContent = actionId
        ? (buildListingResponse(actionId, listing) ?? mockResponses[actionId] ?? fallback)
        : fallback;

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, delay);
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowActions(false);
    simulateResponse();
  };

  const handleQuickAction = (action: QuickAction) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: action.prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setShowActions(false);
    simulateResponse(action.id);
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');

      if (processed.startsWith('# ')) {
        return <h3 key={i} className="text-base font-semibold mt-3 mb-1" dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />;
      }
      if (processed.startsWith('## ')) {
        return <h4 key={i} className="text-sm font-semibold mt-2 mb-1" dangerouslySetInnerHTML={{ __html: processed.slice(3) }} />;
      }
      if (processed.match(/^[•\-]\s/)) {
        return <li key={i} className="ml-4 text-sm list-disc" dangerouslySetInnerHTML={{ __html: processed.replace(/^[•\-]\s/, '') }} />;
      }
      if (processed.match(/^\d+\.\s/)) {
        return <li key={i} className="ml-4 text-sm list-decimal" dangerouslySetInnerHTML={{ __html: processed.replace(/^\d+\.\s/, '') }} />;
      }
      if (processed.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} className="text-sm" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-[440px] h-[640px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">AI Listing Assistant</h3>
            <p className="text-blue-100 text-xs">{listing?.address ?? 'Listing Assistant'}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] ${message.role === 'user' ? 'order-1' : ''}`}>
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm">{message.content}</p>
                ) : (
                  <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
                )}
              </div>
              {message.role === 'assistant' && message.id !== '0' && (
                <div className="flex items-center gap-2 mt-1.5 ml-1">
                  <button
                    onClick={() => handleCopy(message.content, message.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {copiedId === message.id ? (
                      <>
                        <Check className="w-3 h-3 text-green-500" />
                        <span className="text-green-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm text-gray-500">Analyzing listing data...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {showActions && (
        <div className="px-4 pb-2 flex-shrink-0">
          <button
            onClick={() => setShowActions(false)}
            className="flex items-center gap-1 text-xs text-gray-500 mb-2 hover:text-gray-700"
          >
            <Sparkles className="w-3 h-3" />
            Quick Actions
            <ChevronDown className="w-3 h-3" />
          </button>
          <div className="grid grid-cols-2 gap-1.5">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition-all text-left group"
              >
                <span className="text-gray-500 group-hover:text-blue-500 flex-shrink-0">{action.icon}</span>
                <span className="text-xs text-gray-700 group-hover:text-blue-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this listing..."
              rows={1}
              className="w-full px-4 py-2.5 bg-gray-100 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              style={{ maxHeight: '80px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {!showActions && (
          <button
            onClick={() => setShowActions(true)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-2 ml-1 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            Show quick actions
          </button>
        )}
      </div>
    </div>
  );
}
