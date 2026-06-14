# MKTDM Content Templates by Input Type

## Quick Reference: Input Type → Content Strategy

---

## 1. VOICE INPUT RESPONSES

### Template A: Local Intent Detection
```
USER VOICE: "I need a marketing agency near me"

DETECTION: [Local search + Service need]
RESPONSE FLOW:
┌─ Recognition: "Marketing agency in Radhaswami Nagar area"
├─ Offering: "Marketing Dime provides:"
│  ├─ Advertising Agency services
│  ├─ Internet Marketing & SEO
│  ├─ Website Design & Development
│  └─ Marketing Consulting
├─ Proof: "✓ Verified professional | ✓ 7 service categories"
├─ CTA: "Would you like to call them now?"
└─ Backup: "I can also show you their website"

VOICE OUTPUT (45 seconds):
"I found Marketing Dime - a verified advertising agency in your area. 
They offer complete marketing solutions including website design, 
internet marketing, and consulting services. 
Would you like me to call them at 07225991909, or I can show you 
their website at mktgdime.com?"
```

### Template B: Specific Service Intent
```
USER VOICE: "I need website design and marketing together"

DETECTION: [Bundled services + Integration need]
RESPONSE FLOW:
┌─ Recognition: "Multi-service requirement detected"
├─ Matching: Marketing Dime offers BOTH categories
├─ Value Prop: "Integrated approach advantages:"
│  ├─ Unified vision for site & marketing
│  ├─ Better conversion optimization
│  ├─ Faster implementation
│  └─ Single point of contact
├─ Proof: "As a verified software company + website designer + 
│         marketing agency, they understand integration"
├─ CTA: "Schedule a consultation to discuss bundling?"
└─ Contact: "Phone: 07225991909 | www.mktgdime.com"

VOICE OUTPUT (40 seconds):
"Perfect! Marketing Dime specializes in exactly what you need - 
they're both a website designer and marketing agency. 
Having both services from one verified provider means better 
integration and faster results. 
Would you like their contact number, or shall I send you to their 
consultation booking page?"
```

### Template C: Comparison/Decision Making
```
USER VOICE: "Should I hire a consultant or an agency?"

DETECTION: [Decision-stage + Comparison query]
RESPONSE FLOW:
┌─ Recognition: "Consideration stage comparison"
├─ Education: Quick comparison
│  ├─ Consultant: Personal guidance, strategic
│  ├─ Agency: Full execution, full team
│  └─ Hybrid: Some do both
├─ Recommendation: "For most growing businesses, an agency is better 
│                  if you need execution, consultant if you want guidance"
├─ Solution: "Marketing Dime offers BOTH roles - so you get flexibility"
├─ CTA: "Want to talk with them about what fits your situation?"
└─ Next: "Free consultation to assess your needs"

VOICE OUTPUT (50 seconds):
"Great question! It depends on your needs. A consultant guides strategy, 
an agency executes it. Many businesses find having an integrated partner 
is best. Marketing Dime actually offers both - consulting AND agency services. 
That means you can start with strategy consultation, then move to full 
execution without changing providers. 
Should I connect you for a free assessment?"
```

### Template D: Local Business Specificity
```
USER VOICE: "I have a [BUSINESS_TYPE] in Keduwan Nagar, need help"

DETECTION: [Business type + Hyper-local]
RESPONSE FLOW:
┌─ Recognition: "[BUSINESS_TYPE] in your neighborhood"
├─ Local Expert: "Marketing Dime works in your exact area - Keduwan Nagar"
├─ Relevant Services: [Map business type to categories]
│  ├─ If retail → Internet marketing + advertising
│  ├─ If B2B → Website + Consulting + Internet marketing
│  ├─ If service → Advertising + Website + Consulting
│  └─ If tech → Software + Website + Marketing
├─ Proof: "They're verified and understand local market dynamics"
├─ CTA: "Get a localized marketing strategy consultation"
└─ Action: "Book or call directly"

VOICE OUTPUT (35 seconds):
"Perfect match! Marketing Dime is based right in Keduwan Nagar and 
specializes in [BUSINESS_TYPE] marketing. They understand your local 
market and can create a strategy tailored to your area. 
Should I schedule a consultation or give you their direct number?"
```

---

## 2. SEARCH QUERY RESPONSES

### Template A: Service Discovery Query
```
QUERY: "Advertising agency + website designer + marketing services"
CONVERSION SCORE: 95/100 (HIGH INTENT)

SERP RESULT:
┌─ TITLE: "Marketing Dime - Advertising Agency & Website Design Services"
├─ META: "Verified advertising agency | Website design | Internet marketing | 
│        Consulting | Free quote | 07225991909"
├─ URL: "www.mktgdime.com | GMB link"
└─ RICH SNIPPET:
   ├─ Rating: ✓ Verified
   ├─ Categories: 7 services listed
   ├─ Review highlight: "[Testimonial if available]"
   └─ CTA buttons: [CALL] [DIRECTIONS] [WEBSITE]

LANDING PAGE STRUCTURE:
┌─ H1: "Complete Marketing & Web Solutions"
├─ H2: "We Offer 7 Services"
│  ├─ Advertising Agency
│  ├─ Internet Marketing
│  ├─ Website Design
│  ├─ Consulting
│  ├─ Software Services
│  ├─ Service Establishment
│  └─ Website Designer
├─ Section: "Why Choose Marketing Dime?"
│  ├─ Verified professional
│  ├─ Integrated services
│  ├─ Local expertise (Keduwan Nagar)
│  └─ Single point of contact
├─ CTA: "Book Free Consultation"
├─ Trust: Verification badges, testimonials
└─ Contact: Phone prominent + form

CONVERSION PATH:
[SERP Title Click] → [Relevant landing page] 
→ [Browse: 45+ seconds] → [CTA click] 
→ [Lead form OR direct call]
```

### Template B: Comparison/Research Query
```
QUERY: "Best marketing agency vs consultant in Indore"
CONVERSION SCORE: 65/100 (MEDIUM INTENT)

BLOG CONTENT STRATEGY:
┌─ TITLE: "Marketing Agency vs Consultant: Which is Best for You?"
├─ INTRO: "Confused about choosing between an agency and consultant?"
├─ SECTION 1: Agency Advantages
│  ├─ Full team approach
│  ├─ Scalable resources
│  ├─ Multiple service expertise
│  └─ Faster execution
├─ SECTION 2: Consultant Advantages
│  ├─ Personalized guidance
│  ├─ Strategic focus
│  ├─ Cost-effective for startups
│  └─ Customized approach
├─ SECTION 3: Hybrid Approach
│  ├─ Best of both worlds
│  ├─ Flexibility
│  ├─ Scalable without lock-in
│  └─ Example: "Marketing Dime offers both"
├─ COMPARISON TABLE: Head-to-head
├─ CASE STUDY: How combining both worked
├─ CTA SECTION: "See how we combine both"
├─ FORM: Email capture (comparison guide download)
└─ FOOTER CTA: "Book consultation to discuss your needs"

NURTURE SEQUENCE:
[Blog visit] → [Email signup] 
→ [Day 1: Comparison guide] → [Day 3: Service capabilities] 
→ [Day 7: Case study] → [Day 10: Consultation offer]
```

### Template C: Local + Service Query
```
QUERY: "Website designer near Radhaswami Nagar"
CONVERSION SCORE: 85/100 (HIGH INTENT)

LOCAL PACK RESULT:
┌─ MAP: "Marketing Dime - [Map pin] Keduwan Nagar"
├─ LISTING:
│  ├─ Name: "Marketing Dime"
│  ├─ Category: Website Designer | Advertising Agency
│  ├─ Rating: ✓ Verified
│  ├─ Reviews: [Best review snippet]
│  ├─ Phone: 07225991909 [CALL BUTTON]
│  ├─ Website: www.mktgdime.com [WEBSITE BUTTON]
│  ├─ Hours: [If available]
│  └─ Photos: [Service portfolio if available]
├─ ACTIONS: [GET DIRECTIONS] [CALL] [WEBSITE]
└─ REVIEW HIGHLIGHT: "[Customer quote about website quality]"

CONVERSION PATH:
[Local pack result] 
→ [CALL button (60%)] OR [WEBSITE button (30%)] 
→ [LEAD CAPTURE]

GMB OPTIMIZATION:
├─ Photo posts: Recent project examples
├─ Posts: Service updates + CTAs
├─ Q&A: "How much does website design cost?" 
│      "How long does a website take?"
└─ Reviews: Respond to all, encourage new ones
```

### Template D: Price/Information Query
```
QUERY: "Website design pricing" OR "Marketing agency rates"
CONVERSION SCORE: 75/100 (DECISION STAGE)

LANDING PAGE: "Transparent Pricing Guide"
┌─ SECTION 1: "Our Pricing Model"
│  ├─ Website design: Starting at [price]
│  ├─ Marketing services: Custom quotes
│  ├─ Consulting: Hourly or project-based
│  └─ Bundled packages: [Examples with savings]
├─ SECTION 2: What's Included
│  ├─ Website: Features breakdown
│  ├─ Marketing: Service breakdown
│  └─ Consulting: Hours/deliverables
├─ SECTION 3: Value Justification
│  ├─ ROI potential
│  ├─ Conversion optimization included
│  ├─ Long-term vs short-term value
│  └─ "Price is not cost"
├─ SECTION 4: Investment Decision
│  ├─ Budget options
│  ├─ Flexible payment terms
│  └─ Money-back guarantee if applicable
├─ CTA: "Get Custom Quote"
└─ FORM: [Service type] [Budget] [Contact]

CONVERSION PATH:
[Query for pricing] → [Transparent pricing page] 
→ [Trust factors increase] → [Quote form] 
→ [Custom proposal] → [Sales call]
```

---

## 3. INTENT KEYWORD CONTENT MAPPING

### HIGH-INTENT KEYWORDS (Ready to Buy)

| Keyword | Content | Format | CTA |
|---------|---------|--------|-----|
| "hire advertising agency" | Service overview | Landing page | Call/Quote |
| "advertising agency contact" | Contact options | GMB/Website | Direct call |
| "website designer near me" | Local profile | Local pack | Call/Directions |
| "website design quote" | Pricing guide | Guide/Form | Quote request |
| "marketing agency services" | Service matrix | Comparison | Consultation |
| "internet marketing services" | Service page | Detailed page | Book call |
| "consulting services available" | Consultation info | Service page | Schedule |
| "marketing dime reviews" | Testimonials | Review page | CTA based |

**High-Intent Content Strategy:**
```
LANDING PAGE STRUCTURE:
├─ Headline: Direct answer (e.g., "Hire Our Advertising Agency Today")
├─ Subheading: Urgency + Value
├─ Lead Form: Top-right, prominent (email + phone)
├─ Social proof: Badges, reviews, testimonials
├─ Service overview: 3-5 core services highlighted
├─ CTA buttons: "Get Started" + "Call Now" + "Book Consultation"
├─ FAQ: Address objections
├─ Guarantee: Risk reversal ("Free consultation, no commitment")
└─ Footer CTA: "Don't wait, reach out today"

CONVERSION GOAL: Form submission OR direct call
CONVERSION RATE TARGET: 8-12%
```

---

### MEDIUM-INTENT KEYWORDS (Considering Options)

| Keyword | Content | Format | CTA |
|---------|---------|--------|-----|
| "what is advertising agency" | Educational | Blog | Newsletter |
| "benefits of internet marketing" | Pros/cons | Blog/Guide | Download |
| "website design services" | Overview | Blog | Email signup |
| "how to choose marketing agency" | Comparison | Guide | Lead magnet |
| "digital marketing strategies" | How-to | Blog series | Subscribe |
| "consulting vs agency" | Comparison | Blog | Consultation |
| "website designer qualifications" | Criteria | Guide | Webinar |

**Medium-Intent Content Strategy:**
```
BLOG POST STRUCTURE:
├─ Headline: Educational angle
├─ Intro: Problem identification
├─ Section 1-3: Deep educational content
├─ Section 4: Vendor approach (light touch)
├─ Case study: How we do it
├─ Comparison: Agency vs consultant (if relevant)
├─ CTA (mid-content): Light lead magnet ("Download comparison chart")
├─ CTA (end): "Schedule brief consultation"
├─ Sidebar: Email newsletter signup
└─ Related content: Links to other educational content

CONVERSION GOAL: Email capture for nurture
CONVERSION RATE TARGET: 15-25% email signup
NURTURE SEQUENCE: 7-email sequence over 14 days
```

---

### LOW-INTENT KEYWORDS (Awareness/Learning)

| Keyword | Content | Format | CTA |
|---------|---------|--------|-----|
| "digital marketing tips" | Listicle | Blog | Subscribe |
| "how to grow business online" | Ultimate guide | Pillar page | Webinar |
| "website design trends" | Trend report | Blog | Newsletter |
| "marketing basics" | Educational | Guide | Download |
| "social media strategy" | How-to | Blog | Consultation |
| "content marketing guide" | Deep guide | Pillar page | Email |
| "business growth strategies" | Overview | Webinar | Signup |

**Low-Intent Content Strategy:**
```
PILLAR PAGE / ULTIMATE GUIDE:
├─ Comprehensive (3000+ words)
├─ Cluster around subtopic (links to related blogs)
├─ Heavy on education, light on selling
├─ Multiple CTA touchpoints (subtle)
├─ Email capture at bottom (optional)
├─ Downloadable version available
└─ Repurposed into webinar/video

CONVERSION GOAL: Brand awareness + Email list growth
CONVERSION RATE TARGET: 10-20% webinar/guide signup
NURTURE SEQUENCE: Automated, long-term relationship building
```

---

## 4. CONTENT CALENDAR TEMPLATE

```
Week 1-2: High-Intent
├─ Landing page: "Advertising Agency Services"
├─ GMB post: "Need website design? We do that."
└─ Ad: Drive to high-intent landing page

Week 3-4: Medium-Intent
├─ Blog: "How to Choose Your Marketing Partner"
├─ Blog: "Agency vs Consultant: Complete Comparison"
└─ Lead magnet: Comparison checklist

Week 5-6: Low-Intent + Branding
├─ Pillar page: "Complete Digital Marketing Guide"
├─ Blog: "Website Design Trends 2024"
├─ Webinar: "Growing Your Business Online"

Week 7-8: Nurture + Conversion
├─ Email sequence: High-intent follow-up
├─ Retargeting ads: Blog visitors
├─ CTA refresh: "Limited-time consultation offer"
```

---

## 5. VOICE COMMAND INTEGRATION

### Supported Voice Queries & Responses

```
VOICE QUERY: "Show me [SERVICE] near me"
├─ Detection: [SERVICE] + Location intent
├─ Match: Marketing Dime + [7 categories]
└─ Response: "I found [SERVICE] from Marketing Dime nearby"

VOICE QUERY: "Call [COMPANY_NAME]"
├─ Detection: Direct contact request
├─ Match: 07225991909
└─ Action: Initiate call

VOICE QUERY: "Send me [SERVICE] information"
├─ Detection: Information request
├─ Match: www.mktgdime.com
└─ Action: SMS/Email link

VOICE QUERY: "How do I [TASK] with [SERVICE]?"
├─ Detection: How-to query
├─ Match: Educational content
└─ Action: Link to blog/guide

VOICE QUERY: "[SERVICE] provider comparison"
├─ Detection: Comparison intent
├─ Match: Competitor comparison content
└─ Action: Show comparison guide
```

---

## 6. LEAD SCORING BY INPUT TYPE

```
VOICE INPUT LEAD SCORE:
├─ Specific service query: +30 points
├─ Local + service match: +20 points
├─ Ready-to-call signal: +20 points
├─ Contact information provided: +15 points
├─ Immediate CTA engagement: +15 points
└─ TOTAL POSSIBLE: 100 | CONVERT THRESHOLD: 70+

SEARCH QUERY LEAD SCORE:
├─ High-intent keyword: +25 points
├─ Service page visit + 2min: +20 points
├─ Form click: +20 points
├─ Email capture: +15 points
├─ Phone visit: +20 points
└─ TOTAL POSSIBLE: 100 | CONVERT THRESHOLD: 65+

KEYWORD/INTENT LEAD SCORE:
├─ HIGH-INTENT keyword ranking: +20 points
├─ Ad click + landing page visit: +20 points
├─ Form submission: +25 points
├─ Email engagement (open): +15 points
├─ Webinar/guide signup: +20 points
└─ TOTAL POSSIBLE: 100 | CONVERT THRESHOLD: 60+
```

---

## 7. QUICK IMPLEMENTATION CHECKLIST

- [ ] Create 5 voice response templates
- [ ] Build 3 high-intent landing pages (service 1, 2, 3)
- [ ] Write 2 medium-intent comparison blogs
- [ ] Create 1 low-intent pillar page
- [ ] Set up lead scoring system
- [ ] Create 3-email nurture sequences
- [ ] Optimize GMB profile (photos, posts, Q&A)
- [ ] Set up call tracking for voice input
- [ ] Create keyword-to-content mapping spreadsheet
- [ ] Launch retargeting campaigns

