import {Button} from '@/app/components/ui/button'
import {Icon} from '@/app/components/ui/Icon'
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/app/components/ui/accordion'
import {Divider} from '@/app/components/ui/divider'
import {Card} from '@/app/components/ui/card'
import {Eyebrow} from '@/app/components/ui/eyebrow'
import {Breadcrumb} from '@/app/components/ui/breadcrumb'
import {Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption} from '@/app/components/ui/table'
import {Slider, SliderSlide} from '@/app/components/ui/slider'
import {Tabs, TabsList, TabsTrigger, TabsContent} from '@/app/components/ui/tabs'
import {Modal, ModalTrigger, ModalContent, ModalHeader, ModalTitle, ModalBody, ModalFooter, VideoModalContent} from '@/app/components/ui/modal'
import {InlineVideo} from '@/app/components/ui/inline-video'
import {Marquee, MarqueeItem} from '@/app/components/ui/marquee'
import {ThemeToggle, ThemeToggleCompact} from '@/app/components/ui/theme-toggle'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  Download,
  Heart,
  Lightning,
  MoonStars,
  Star,
  Sun,
  Target,
  Trophy,
  User,
} from '@phosphor-icons/react/dist/ssr'

export const metadata = {
  title: 'Design System',
  description: 'Visual overview of all design system components, colors, and typography',
}

// Color definitions from the Mast theme
const colors = {
  primary: [
    {name: 'Black', value: '#1d1c1a', textClass: 'text-white'},
    {name: 'White', value: '#ffffff', textClass: 'text-black', border: true},
    {name: 'Brand', value: '#d14424', textClass: 'text-white'},
    {name: 'Brand Dark', value: '#9c331b', textClass: 'text-white'},
    {name: 'Blue', value: '#0073e6', textClass: 'text-white'},
    {name: 'Yellow', value: '#f8d47a', textClass: 'text-black'},
  ],
  neutral: [
    {name: 'Light Gray', value: '#f0eee6', textClass: 'text-black'},
    {name: 'Mid Gray 1', value: '#cccabf', textClass: 'text-black'},
    {name: 'Mid Gray 2', value: '#474641', textClass: 'text-white'},
    {name: 'Dark Gray', value: '#292825', textClass: 'text-white'},
  ],
  gray: [
    {name: 'Gray 50', value: '#f0eee6', textClass: 'text-black'},
    {name: 'Gray 100', value: '#e5e3db', textClass: 'text-black'},
    {name: 'Gray 200', value: '#d4d2c8', textClass: 'text-black'},
    {name: 'Gray 300', value: '#cccabf', textClass: 'text-black'},
    {name: 'Gray 400', value: '#9a9890', textClass: 'text-black'},
    {name: 'Gray 500', value: '#6b6961', textClass: 'text-white'},
    {name: 'Gray 600', value: '#474641', textClass: 'text-white'},
    {name: 'Gray 700', value: '#353430', textClass: 'text-white'},
    {name: 'Gray 800', value: '#292825', textClass: 'text-white'},
    {name: 'Gray 900', value: '#1d1c1a', textClass: 'text-white'},
    {name: 'Gray 950', value: '#141311', textClass: 'text-white'},
  ],
}

function Section({
  title,
  children,
  dark = false,
}: {
  title: string
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <section className={`py-12 ${dark ? 'bg-gray-900 text-white' : 'text-[var(--primary-foreground)]'}`}>
      <div className="container">
        <h2 className={`text-h3 mb-8 pb-4 border-b ${dark ? 'border-gray-700' : 'border-[var(--primary-border)]'}`}>{title}</h2>
        {children}
      </div>
    </section>
  )
}

function ColorSwatch({
  name,
  value,
  textClass,
  border,
}: {
  name: string
  value: string
  textClass: string
  border?: boolean
}) {
  return (
    <div className="flex flex-col">
      <div
        className={`h-16 w-full rounded-lg flex items-end p-2 ${textClass} ${border ? 'border border-[var(--primary-border)]' : ''}`}
        style={{backgroundColor: value}}
      >
        <span className="text-xs font-medium">{value}</span>
      </div>
      <span className="text-sm mt-2 font-medium">{name}</span>
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen text-[var(--primary-foreground)]">
      {/* Header */}
      <div className="bg-[var(--muted-background)] py-16">
        <div className="container">
          <h1 className="text-h1 mb-4 text-[var(--primary-foreground)]">Design System</h1>
          <p className="text-p-xl text-[var(--muted-foreground)] max-w-3xl">
            Based on the Mast framework. Features General Sans typography, fluid sizing with CSS clamp(),
            Phosphor icons, and a max-width container (90rem) with 6vw responsive gutters.
          </p>
        </div>
      </div>

      {/* Font Info */}
      <Section title="Typography - Font">
        <div className="flex flex-wrap gap-8 items-center">
          <div className="flex-1 min-w-[200px]">
            <p className="text-p-sm text-[var(--muted-foreground)] mb-2">Primary Font</p>
            <p className="text-h2">General Sans</p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="text-p-sm text-[var(--muted-foreground)] mb-2">Regular (400)</p>
              <p className="text-h4 font-normal">Aa Bb Cc 123</p>
            </div>
            <div>
              <p className="text-p-sm text-[var(--muted-foreground)] mb-2">Medium (500)</p>
              <p className="text-h4 font-medium">Aa Bb Cc 123</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Typography - Headings */}
      <Section title="Typography - Headings (Fluid)">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          All typography uses CSS clamp() for fluid scaling between viewport widths 320px - 1440px.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-2 block">H1 — clamp(2.8rem → 5.5rem) / 44-88px</span>
            <h1 className="text-h1">The quick brown fox jumps</h1>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-2 block">H2 — clamp(2rem → 3.8rem) / 32-61px</span>
            <h2 className="text-h2">The quick brown fox jumps over</h2>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-2 block">H3 — clamp(1.5rem → 2.3rem) / 24-37px</span>
            <h3 className="text-h3">The quick brown fox jumps over the lazy dog</h3>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-2 block">H4 — clamp(1.3rem → 1.5rem) / 21-24px</span>
            <h4 className="text-h4">The quick brown fox jumps over the lazy dog</h4>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-2 block">H5 — clamp(1.1rem → 1.2rem) / 18-19px</span>
            <h5 className="text-h5">The quick brown fox jumps over the lazy dog</h5>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-2 block">H6 — clamp(0.9rem → 1rem) / 14-16px</span>
            <h6 className="text-h6">The quick brown fox jumps over the lazy dog</h6>
          </div>
        </div>
      </Section>

      {/* Typography - Paragraphs */}
      <Section title="Typography - Paragraphs (Fluid)">
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-2 block">Paragraph XL — clamp(1.2rem → 1.5rem) / 19-24px</span>
            <p className="text-p-xl">
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
              How vexingly quick daft zebras jump!
            </p>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-2 block">Paragraph LG — clamp(1.1rem → 1.25rem) / 18-20px</span>
            <p className="text-p-lg">
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
              How vexingly quick daft zebras jump!
            </p>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-2 block">Body (Default) — clamp(0.9rem → 1rem) / 14-16px</span>
            <p className="text-body">
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
              How vexingly quick daft zebras jump!
            </p>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-2 block">Paragraph SM — clamp(0.8rem → 0.9rem) / 13-14px</span>
            <p className="text-p-sm">
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
              How vexingly quick daft zebras jump!
            </p>
          </div>
        </div>
      </Section>

      {/* Colors */}
      <Section title="Colors - Primary & Secondary">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {colors.primary.map((color) => (
            <ColorSwatch key={color.name} {...color} />
          ))}
        </div>
      </Section>

      <Section title="Colors - Neutral">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {colors.neutral.map((color) => (
            <ColorSwatch key={color.name} {...color} />
          ))}
        </div>
      </Section>

      <Section title="Colors - Gray Scale">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-4">
          {colors.gray.map((color) => (
            <ColorSwatch key={color.name} {...color} />
          ))}
        </div>
      </Section>

      {/* Buttons - Simplified to match Mast for Webflow */}
      <Section title="Buttons">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Simplified to 3 variants (primary, secondary, ghost) and 3 color schemes (brand, black, white).
          Uses CSS variables for consistent sizing.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-sm text-[var(--muted-foreground)] mb-4 block">Primary Variant</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" colorScheme="brand">
                Brand (Default)
              </Button>
              <Button variant="primary" colorScheme="black">
                Black
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm text-[var(--muted-foreground)] mb-4 block">Secondary Variant (Outline)</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" colorScheme="brand">
                Brand Outline
              </Button>
              <Button variant="secondary" colorScheme="black">
                Black Outline
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm text-[var(--muted-foreground)] mb-4 block">Ghost Variant</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="ghost" colorScheme="brand">
                Brand Ghost
              </Button>
              <Button variant="ghost" colorScheme="black">
                Black Ghost
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm text-[var(--muted-foreground)] mb-4 block">With Icons</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" colorScheme="brand">
                Continue <ArrowRight className="h-4 w-4 ml-2" weight="bold" />
              </Button>
              <Button variant="secondary" colorScheme="black">
                External <ArrowUpRight className="h-4 w-4 ml-2" weight="bold" />
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Buttons on Dark Background */}
      <Section title="Buttons - On Dark Background" dark>
        <div className="space-y-8">
          <div>
            <span className="text-sm text-gray-300 mb-4 block">Primary White</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" colorScheme="white">
                White Button
              </Button>
              <Button variant="primary" colorScheme="white">
                With Icon <ArrowRight className="h-4 w-4 ml-2" weight="bold" />
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-300 mb-4 block">Secondary White</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" colorScheme="white">
                White Outline
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-300 mb-4 block">Ghost White</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="ghost" colorScheme="white">
                White Ghost
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Icons */}
      <Section title="Icons (Phosphor)">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Uses the Phosphor icon library. Icons support multiple sizes and colors.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Sizes</span>
            <div className="flex flex-wrap items-end gap-8">
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Star} size="xs" />
                <span className="text-p-sm text-[var(--muted-foreground)]">XS (16px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Star} size="sm" />
                <span className="text-p-sm text-[var(--muted-foreground)]">SM (24px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Star} size="md" />
                <span className="text-p-sm text-[var(--muted-foreground)]">MD (32px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Star} size="lg" />
                <span className="text-p-sm text-[var(--muted-foreground)]">LG (48px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Star} size="xl" />
                <span className="text-p-sm text-[var(--muted-foreground)]">XL (64px)</span>
              </div>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Colors</span>
            <div className="flex flex-wrap items-center gap-6">
              <Icon icon={Heart} size="lg" color="brand" />
              <Icon icon={Lightning} size="lg" color="blue" />
              <Icon icon={Star} size="lg" color="yellow" />
              <Icon icon={CheckCircle} size="lg" color="black" />
              <span className="bg-gray-900 p-2 rounded-lg">
                <Icon icon={Sun} size="lg" color="white" />
              </span>
              <Icon icon={Target} size="lg" color="gray" />
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Weights</span>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="thin" />
                <span className="text-p-sm text-[var(--muted-foreground)]">Thin</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="light" />
                <span className="text-p-sm text-[var(--muted-foreground)]">Light</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="regular" />
                <span className="text-p-sm text-[var(--muted-foreground)]">Regular</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="bold" />
                <span className="text-p-sm text-[var(--muted-foreground)]">Bold</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="fill" />
                <span className="text-p-sm text-[var(--muted-foreground)]">Fill</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="duotone" />
                <span className="text-p-sm text-[var(--muted-foreground)]">Duotone</span>
              </div>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Sample Icons</span>
            <div className="flex flex-wrap items-center gap-4">
              <Icon icon={CheckCircle} size="md" color="brand" />
              <Icon icon={Target} size="md" color="brand" />
              <Icon icon={Star} size="md" color="brand" />
              <Icon icon={Trophy} size="md" color="brand" />
              <Icon icon={Heart} size="md" color="brand" />
              <Icon icon={Lightning} size="md" color="brand" />
              <Icon icon={User} size="md" color="brand" />
              <Icon icon={ArrowRight} size="md" color="brand" />
              <Icon icon={ArrowUpRight} size="md" color="brand" />
              <Icon icon={Download} size="md" color="brand" />
              <Icon icon={Sun} size="md" color="brand" />
              <Icon icon={MoonStars} size="md" color="brand" />
            </div>
          </div>
        </div>
      </Section>

      {/* Accordion */}
      <Section title="Accordion">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Collapsible content sections built with native HTML details/summary elements.
          Features a plus icon that rotates to an X when open, matching the Mast framework.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Single open at a time</span>
            <Accordion allowMultiple={false} className="w-full max-w-xl">
              <AccordionItem>
                <AccordionTrigger>What is fluid typography?</AccordionTrigger>
                <AccordionContent>
                  Fluid typography uses CSS clamp() to smoothly scale font sizes between a minimum and maximum
                  value based on the viewport width, eliminating abrupt size changes at breakpoints.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem>
                <AccordionTrigger>How does the container work?</AccordionTrigger>
                <AccordionContent>
                  The container has a max-width of 90rem (1440px) with 6vw responsive gutters on each side.
                  Below the max-width, it fills 100% of the viewport minus the gutters.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem>
                <AccordionTrigger>What icon library is used?</AccordionTrigger>
                <AccordionContent>
                  We use Phosphor Icons, a flexible icon family with multiple weights (thin, light, regular,
                  bold, fill, duotone) and consistent sizing.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">With default open item</span>
            <Accordion allowMultiple={false} className="w-full max-w-xl">
              <AccordionItem defaultOpen>
                <AccordionTrigger>This starts open</AccordionTrigger>
                <AccordionContent>
                  Use the defaultOpen prop on AccordionItem to specify which item should be open by default.
                  This is useful for FAQ sections where you want to highlight the first answer.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem>
                <AccordionTrigger>This starts closed</AccordionTrigger>
                <AccordionContent>
                  Other items remain closed until clicked.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Multiple open at once</span>
            <Accordion allowMultiple className="w-full max-w-xl">
              <AccordionItem>
                <AccordionTrigger>First section</AccordionTrigger>
                <AccordionContent>
                  With allowMultiple=true, multiple sections can be open simultaneously.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem>
                <AccordionTrigger>Second section</AccordionTrigger>
                <AccordionContent>
                  Click to open this while keeping the first one open.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Section>

      {/* Divider */}
      <Section title="Divider">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Horizontal rule with configurable spacing and colors using the project&apos;s spacing scale.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Default</span>
            <div className="bg-[var(--muted-background)] p-6 rounded-lg">
              <p className="text-body">Content above the divider</p>
              <Divider />
              <p className="text-body">Content below the divider</p>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Colors</span>
            <div className="bg-[var(--muted-background)] p-6 rounded-lg space-y-1">
              <div className="flex items-center gap-4">
                <span className="text-p-sm w-20">Default</span>
                <div className="flex-1"><Divider marginTop="2" marginBottom="2" /></div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-p-sm w-20">Light</span>
                <div className="flex-1"><Divider marginTop="2" marginBottom="2" color="light" /></div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-p-sm w-20">Dark</span>
                <div className="flex-1"><Divider marginTop="2" marginBottom="2" color="dark" /></div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-p-sm w-20">Brand</span>
                <div className="flex-1"><Divider marginTop="2" marginBottom="2" color="brand" /></div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-p-sm w-20">Blue</span>
                <div className="flex-1"><Divider marginTop="2" marginBottom="2" color="blue" /></div>
              </div>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Spacing variations</span>
            <div className="bg-[var(--muted-background)] p-6 rounded-lg">
              <p className="text-p-sm text-[var(--muted-foreground)]">marginTop=&quot;0&quot; marginBottom=&quot;0&quot;</p>
              <Divider marginTop="0" marginBottom="0" />
              <p className="text-p-sm text-[var(--muted-foreground)]">marginTop=&quot;4&quot; marginBottom=&quot;4&quot;</p>
              <Divider marginTop="4" marginBottom="4" />
              <p className="text-p-sm text-[var(--muted-foreground)]">marginTop=&quot;8&quot; marginBottom=&quot;8&quot; (default)</p>
              <Divider marginTop="8" marginBottom="8" />
              <p className="text-p-sm text-[var(--muted-foreground)]">marginTop=&quot;16&quot; marginBottom=&quot;16&quot;</p>
              <Divider marginTop="16" marginBottom="16" />
              <p className="text-p-sm text-[var(--muted-foreground)]">End of examples</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Eyebrow */}
      <Section title="Eyebrow">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Small uppercase text typically used above headings. Three style variants available.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Variants</span>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <Eyebrow variant="text">Text Only</Eyebrow>
                <p className="mt-2 text-p-sm text-[var(--muted-foreground)]">Simple uppercase text</p>
              </div>
              <div>
                <Eyebrow variant="overline">Overline Style</Eyebrow>
                <p className="mt-2 text-p-sm text-[var(--muted-foreground)]">With border line above</p>
              </div>
              <div>
                <Eyebrow variant="pill">Pill Badge</Eyebrow>
                <p className="mt-2 text-p-sm text-[var(--muted-foreground)]">In a pill/badge shape</p>
              </div>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Colors</span>
            <div className="flex flex-wrap gap-4">
              <Eyebrow variant="pill" color="default">Default</Eyebrow>
              <Eyebrow variant="pill" color="brand">Brand</Eyebrow>
              <Eyebrow variant="pill" color="blue">Blue</Eyebrow>
              <Eyebrow variant="pill" color="muted">Muted</Eyebrow>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Combined with Heading</span>
            <div className="max-w-xl">
              <Eyebrow variant="overline" color="brand">Featured Article</Eyebrow>
              <h3 className="text-h3 mt-2">The Art of Typography in Web Design</h3>
              <p className="text-p-lg text-[var(--muted-foreground)] mt-2">
                Exploring how thoughtful typography choices enhance user experience.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Breadcrumb */}
      <Section title="Breadcrumb">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Navigation breadcrumbs with eyebrow-style typography. Supports chevron or slash separators.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Chevron Separator (Default)</span>
            <Breadcrumb
              items={[
                {label: 'Home', href: '/'},
                {label: 'Products', href: '/products'},
                {label: 'Electronics', href: '/products/electronics'},
                {label: 'Smartphones'},
              ]}
              separator="chevron"
            />
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Slash Separator</span>
            <Breadcrumb
              items={[
                {label: 'Home', href: '/'},
                {label: 'Blog', href: '/blog'},
                {label: 'Design Tips'},
              ]}
              separator="slash"
            />
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">With External Link</span>
            <Breadcrumb
              items={[
                {label: 'Home', href: '/'},
                {label: 'Documentation', href: 'https://example.com/docs'},
                {label: 'Getting Started'},
              ]}
            />
          </div>
        </div>
      </Section>

      {/* Table */}
      <Section title="Table">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Data tables with multiple style variants. Responsive with horizontal scrolling on small screens.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Default Style</span>
            <Table>
              <TableHeader>
                <TableRow isHeader>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead align="right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Alice Johnson</TableCell>
                  <TableCell>Designer</TableCell>
                  <TableCell align="right">Active</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Bob Smith</TableCell>
                  <TableCell>Developer</TableCell>
                  <TableCell align="right">Active</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Carol White</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell align="right">Away</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Striped Variant</span>
            <Table variant="striped">
              <TableHeader>
                <TableRow isHeader>
                  <TableHead>Product</TableHead>
                  <TableHead align="center">Quantity</TableHead>
                  <TableHead align="right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Widget A</TableCell>
                  <TableCell align="center">25</TableCell>
                  <TableCell align="right">$19.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Widget B</TableCell>
                  <TableCell align="center">12</TableCell>
                  <TableCell align="right">$29.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Widget C</TableCell>
                  <TableCell align="center">8</TableCell>
                  <TableCell align="right">$49.99</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Widget D</TableCell>
                  <TableCell align="center">50</TableCell>
                  <TableCell align="right">$9.99</TableCell>
                </TableRow>
              </TableBody>
              <TableCaption>Product inventory as of today</TableCaption>
            </Table>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Bordered Variant</span>
            <Table variant="bordered">
              <TableHeader>
                <TableRow isHeader>
                  <TableHead>Feature</TableHead>
                  <TableHead align="center">Basic</TableHead>
                  <TableHead align="center">Pro</TableHead>
                  <TableHead align="center">Enterprise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Users</TableCell>
                  <TableCell align="center">1</TableCell>
                  <TableCell align="center">5</TableCell>
                  <TableCell align="center">Unlimited</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Storage</TableCell>
                  <TableCell align="center">5 GB</TableCell>
                  <TableCell align="center">50 GB</TableCell>
                  <TableCell align="center">500 GB</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Support</TableCell>
                  <TableCell align="center">Email</TableCell>
                  <TableCell align="center">Priority</TableCell>
                  <TableCell align="center">24/7</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </Section>

      {/* Slider */}
      <Section title="Slider / Carousel">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Responsive carousel with customizable slides per view, gap, navigation position, effects, and autoplay options.
          Built with Embla Carousel to match Mast/Swiper.js capabilities.
        </p>
        <div className="space-y-12">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Default (3 slides desktop, navigation below)</span>
            <Slider slidesPerViewDesktop={3} slidesPerViewTablet={2} slidesPerViewMobile={1} gap="4">
              {[1, 2, 3, 4, 5].map((i) => (
                <SliderSlide key={i}>
                  <Card variant="filled" className="h-full">
                    <h4 className="text-h4 mb-2">Slide {i}</h4>
                    <p className="text-body text-[var(--muted-foreground)]">This is content inside slide {i}</p>
                  </Card>
                </SliderSlide>
              ))}
            </Slider>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Full-width with Overlay Navigation (Center)</span>
            <Slider
              slidesPerViewDesktop={1}
              slidesPerViewMobile={1}
              gap="0"
              autoplay
              autoplayDelay={4000}
              loop
              navigationPosition="overlay-center"
              effect="fade"
              speed={1200}
            >
              {[1, 2, 3].map((i) => (
                <SliderSlide key={i}>
                  <div className="aspect-[16/9] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="text-h2 mb-2">Full-Width Slide {i}</h3>
                      <p className="text-p-lg opacity-80">Fade effect with overlay navigation</p>
                    </div>
                  </div>
                </SliderSlide>
              ))}
            </Slider>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Overlay Navigation (Edges) with Images</span>
            <Slider
              slidesPerViewDesktop={1}
              slidesPerViewMobile={1}
              gap="0"
              loop
              navigationPosition="overlay-edges"
            >
              {[1, 2, 3, 4].map((i) => (
                <SliderSlide key={i}>
                  <div className="aspect-[21/9] bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="text-h3 mb-2">Hero Slide {i}</h3>
                      <p className="text-body opacity-80">Navigation arrows on left/right edges</p>
                    </div>
                  </div>
                </SliderSlide>
              ))}
            </Slider>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Side Navigation (Outside Slider)</span>
            <Slider slidesPerViewDesktop={2} slidesPerViewMobile={1} gap="6" navigationPosition="sides">
              {[1, 2, 3, 4].map((i) => (
                <SliderSlide key={i}>
                  <Card variant="outline" className="h-full">
                    <Icon icon={Star} size="lg" color="brand" className="mb-4" />
                    <h4 className="text-h5 mb-2">Feature {i}</h4>
                    <p className="text-body text-[var(--muted-foreground)]">Navigation arrows positioned outside the slider</p>
                  </Card>
                </SliderSlide>
              ))}
            </Slider>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">With Autoplay and Loop</span>
            <Slider slidesPerViewDesktop={2} slidesPerViewMobile={1} gap="6" autoplay autoplayDelay={3000} loop>
              {[1, 2, 3, 4].map((i) => (
                <SliderSlide key={i}>
                  <div className="bg-brand/10 border border-brand/20 rounded-lg p-6">
                    <Icon icon={Star} size="lg" color="brand" className="mb-4" />
                    <h4 className="text-h5 mb-2">Feature {i}</h4>
                    <p className="text-body text-[var(--muted-foreground)]">Autoplay enabled with 3 second delay</p>
                  </div>
                </SliderSlide>
              ))}
            </Slider>
          </div>
        </div>
      </Section>

      {/* Tabs */}
      <Section title="Tabs">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Tab navigation with flexible menu positioning (above, below, left, right), optional autoplay
          with progress indicator, and mobile dropdown support. Matches Mast framework tabs capabilities.
        </p>
        <div className="space-y-12">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Horizontal Tabs (Menu Above - Default)</span>
            <Tabs defaultValue="tab1">
              <TabsList>
                <TabsTrigger value="tab1">Overview</TabsTrigger>
                <TabsTrigger value="tab2">Features</TabsTrigger>
                <TabsTrigger value="tab3">Pricing</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1">
                <Card variant="outline">
                  <h4 className="text-h4 mb-2">Overview Content</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    This is the overview tab content. Tabs support any content blocks inside.
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="tab2">
                <Card variant="outline">
                  <h4 className="text-h4 mb-2">Features Content</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    This is the features tab content with different information.
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="tab3">
                <Card variant="outline">
                  <h4 className="text-h4 mb-2">Pricing Content</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    Pricing information would go here in the third tab.
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Menu Below Content</span>
            <Tabs defaultValue="b1" menuPosition="below">
              <TabsList>
                <TabsTrigger value="b1">Tab 1</TabsTrigger>
                <TabsTrigger value="b2">Tab 2</TabsTrigger>
                <TabsTrigger value="b3">Tab 3</TabsTrigger>
              </TabsList>
              <TabsContent value="b1">
                <div className="bg-[var(--muted-background)] rounded-lg p-6">
                  <h4 className="text-h4 mb-2">Content First</h4>
                  <p className="text-body text-[var(--muted-foreground)]">Menu positioned below the content area.</p>
                </div>
              </TabsContent>
              <TabsContent value="b2">
                <div className="bg-[var(--muted-background)] rounded-lg p-6">
                  <h4 className="text-h4 mb-2">Tab 2 Content</h4>
                  <p className="text-body text-[var(--muted-foreground)]">Useful for bottom navigation patterns.</p>
                </div>
              </TabsContent>
              <TabsContent value="b3">
                <div className="bg-[var(--muted-background)] rounded-lg p-6">
                  <h4 className="text-h4 mb-2">Tab 3 Content</h4>
                  <p className="text-body text-[var(--muted-foreground)]">Third tab with menu below.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Menu Left of Content (Vertical Layout)</span>
            <Tabs defaultValue="l1" menuPosition="left" orientation="vertical">
              <TabsList>
                <TabsTrigger value="l1">Dashboard</TabsTrigger>
                <TabsTrigger value="l2">Analytics</TabsTrigger>
                <TabsTrigger value="l3">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="l1">
                <Card variant="filled">
                  <h4 className="text-h4 mb-2">Dashboard</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    Sidebar-style navigation with menu on the left, perfect for app-like layouts.
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="l2">
                <Card variant="filled">
                  <h4 className="text-h4 mb-2">Analytics</h4>
                  <p className="text-body text-[var(--muted-foreground)]">View your analytics data here.</p>
                </Card>
              </TabsContent>
              <TabsContent value="l3">
                <Card variant="filled">
                  <h4 className="text-h4 mb-2">Settings</h4>
                  <p className="text-body text-[var(--muted-foreground)]">Configure your preferences.</p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Menu Right of Content</span>
            <Tabs defaultValue="r1" menuPosition="right" orientation="vertical">
              <TabsList>
                <TabsTrigger value="r1">Option A</TabsTrigger>
                <TabsTrigger value="r2">Option B</TabsTrigger>
                <TabsTrigger value="r3">Option C</TabsTrigger>
              </TabsList>
              <TabsContent value="r1">
                <div className="bg-brand/10 border border-brand/20 rounded-lg p-6">
                  <h4 className="text-h4 mb-2">Content on Left</h4>
                  <p className="text-body text-[var(--muted-foreground)]">Menu positioned to the right of content.</p>
                </div>
              </TabsContent>
              <TabsContent value="r2">
                <div className="bg-brand/10 border border-brand/20 rounded-lg p-6">
                  <h4 className="text-h4 mb-2">Option B Selected</h4>
                  <p className="text-body text-[var(--muted-foreground)]">Alternative layout option.</p>
                </div>
              </TabsContent>
              <TabsContent value="r3">
                <div className="bg-brand/10 border border-brand/20 rounded-lg p-6">
                  <h4 className="text-h4 mb-2">Option C Selected</h4>
                  <p className="text-body text-[var(--muted-foreground)]">Third option content.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Autoplay with Progress Indicator</span>
            <Tabs defaultValue="a1" autoplay autoplayDuration={5000} showProgress>
              <TabsList>
                <TabsTrigger value="a1">Step 1</TabsTrigger>
                <TabsTrigger value="a2">Step 2</TabsTrigger>
                <TabsTrigger value="a3">Step 3</TabsTrigger>
              </TabsList>
              <TabsContent value="a1">
                <div className="bg-[var(--muted-background)] rounded-lg p-6">
                  <Eyebrow variant="pill" color="brand">Step 1</Eyebrow>
                  <h4 className="text-h4 mt-4 mb-2">Getting Started</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    Watch the progress bar below the active tab. Autoplay cycles through tabs with a play/pause button.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="a2">
                <div className="bg-[var(--muted-background)] rounded-lg p-6">
                  <Eyebrow variant="pill" color="brand">Step 2</Eyebrow>
                  <h4 className="text-h4 mt-4 mb-2">Configuration</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    Customize your settings to match your workflow.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="a3">
                <div className="bg-[var(--muted-background)] rounded-lg p-6">
                  <Eyebrow variant="pill" color="brand">Step 3</Eyebrow>
                  <h4 className="text-h4 mt-4 mb-2">Launch</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    Go live and start seeing results immediately.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Vertical Tabs with Autoplay and Progress</span>
            <Tabs defaultValue="v1" orientation="vertical" menuPosition="left" autoplay autoplayDuration={4000} showProgress>
              <TabsList>
                <TabsTrigger value="v1">Phase 1</TabsTrigger>
                <TabsTrigger value="v2">Phase 2</TabsTrigger>
                <TabsTrigger value="v3">Phase 3</TabsTrigger>
              </TabsList>
              <TabsContent value="v1">
                <div className="bg-[var(--muted-background)] rounded-lg p-6">
                  <Icon icon={Target} size="lg" color="brand" className="mb-4" />
                  <h4 className="text-h4 mb-2">Phase 1: Discovery</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    Vertical progress indicator on the left side of active tab.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="v2">
                <div className="bg-[var(--muted-background)] rounded-lg p-6">
                  <Icon icon={Lightning} size="lg" color="brand" className="mb-4" />
                  <h4 className="text-h4 mb-2">Phase 2: Development</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    Build and iterate on your solution.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="v3">
                <div className="bg-[var(--muted-background)] rounded-lg p-6">
                  <Icon icon={Trophy} size="lg" color="brand" className="mb-4" />
                  <h4 className="text-h4 mb-2">Phase 3: Launch</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    Deploy and celebrate your success!
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Mobile Dropdown (resize to mobile to see)</span>
            <Tabs defaultValue="m1" mobileDropdown>
              <TabsList>
                <TabsTrigger value="m1">First Tab</TabsTrigger>
                <TabsTrigger value="m2">Second Tab</TabsTrigger>
                <TabsTrigger value="m3">Third Tab</TabsTrigger>
              </TabsList>
              <TabsContent value="m1">
                <Card variant="outline">
                  <h4 className="text-h4 mb-2">Mobile Dropdown Mode</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    On mobile, tabs collapse into a dropdown menu for better usability.
                    Resize your browser to see the effect.
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="m2">
                <Card variant="outline">
                  <h4 className="text-h4 mb-2">Second Tab Content</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    Content for the second tab in mobile dropdown mode.
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="m3">
                <Card variant="outline">
                  <h4 className="text-h4 mb-2">Third Tab Content</h4>
                  <p className="text-body text-[var(--muted-foreground)]">
                    Content for the third tab in mobile dropdown mode.
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Section>

      {/* Modal */}
      <Section title="Modal">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Dialog overlays for content or video lightbox. Can be triggered by button or URL parameter.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Content Modal</span>
            <div className="flex flex-wrap gap-4">
              <Modal>
                <ModalTrigger asChild>
                  <Button variant="primary" colorScheme="brand">Open Modal</Button>
                </ModalTrigger>
                <ModalContent size="md">
                  <ModalHeader>
                    <ModalTitle>Example Modal</ModalTitle>
                  </ModalHeader>
                  <ModalBody>
                    <p className="text-body text-[var(--muted-foreground)] mb-4">
                      Modals can contain any content including headings, text, images, forms, and more.
                    </p>
                    <Card variant="filled">
                      <p className="text-p-sm">Even cards and other components work inside modals!</p>
                    </Card>
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="secondary" colorScheme="black">Cancel</Button>
                    <Button variant="primary" colorScheme="brand">Confirm</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

              <Modal>
                <ModalTrigger asChild>
                  <Button variant="secondary" colorScheme="black">Large Modal</Button>
                </ModalTrigger>
                <ModalContent size="lg">
                  <ModalHeader>
                    <ModalTitle>Large Size Modal</ModalTitle>
                  </ModalHeader>
                  <ModalBody>
                    <p className="text-body text-[var(--muted-foreground)]">
                      Modal sizes available: sm, md, lg, xl, full
                    </p>
                  </ModalBody>
                </ModalContent>
              </Modal>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Video Lightbox</span>
            <Modal>
              <ModalTrigger asChild>
                <Button variant="primary" colorScheme="black">
                  Play Video <ArrowRight className="h-4 w-4 ml-2" weight="bold" />
                </Button>
              </ModalTrigger>
              <VideoModalContent videoId="dQw4w9WgXcQ" title="Example Video" size="xl" />
            </Modal>
            <p className="text-p-sm text-[var(--muted-foreground)] mt-2">
              YouTube videos automatically play when opened and stop when closed.
            </p>
          </div>
        </div>
      </Section>

      {/* Theme Toggle */}
      <Section title="Theme Toggle">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Dark/light mode toggle with automatic OS preference detection and localStorage persistence.
          Uses CSS light-dark() function for smooth theme transitions.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Switch Toggle with Labels</span>
            <div className="flex items-center gap-8">
              <ThemeToggle showLabels />
              <p className="text-p-sm text-[var(--muted-foreground)]">
                Toggle shows sun/moon icons based on current theme
              </p>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Switch Toggle without Labels</span>
            <div className="flex items-center gap-8">
              <ThemeToggle />
              <p className="text-p-sm text-[var(--muted-foreground)]">
                Minimal switch-only variant
              </p>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Compact Icon Button</span>
            <div className="flex items-center gap-8">
              <ThemeToggleCompact />
              <p className="text-p-sm text-[var(--muted-foreground)]">
                Simple icon button that toggles between sun and moon
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Inline Video */}
      <Section title="Inline Video">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Self-hosted video player with autoplay on scroll, poster image support, and play/pause controls.
          Videos can be muted by default and loop continuously.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">16:9 Aspect Ratio with Controls</span>
            <div className="max-w-3xl">
              <InlineVideo
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                aspectRatio="16/9"
                autoplayOnScroll
                loop
                muted
                showControls
                controlPosition="bottom-right"
              />
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">21:9 Cinematic with Centered Play Button</span>
            <InlineVideo
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
              aspectRatio="21/9"
              autoplayOnScroll={false}
              loop
              muted
              showControls
              controlPosition="center"
            />
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Aspect Ratio Options</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <InlineVideo
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                  aspectRatio="16/9"
                  autoplayOnScroll
                  loop
                  muted
                  showControls={false}
                />
                <p className="text-p-sm text-[var(--muted-foreground)] mt-2 text-center">16:9 (Video)</p>
              </div>
              <div>
                <InlineVideo
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
                  aspectRatio="4/3"
                  autoplayOnScroll
                  loop
                  muted
                  showControls={false}
                />
                <p className="text-p-sm text-[var(--muted-foreground)] mt-2 text-center">4:3 (Classic)</p>
              </div>
              <div>
                <InlineVideo
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
                  aspectRatio="1/1"
                  autoplayOnScroll
                  loop
                  muted
                  showControls={false}
                />
                <p className="text-p-sm text-[var(--muted-foreground)] mt-2 text-center">1:1 (Square)</p>
              </div>
              <div>
                <InlineVideo
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
                  aspectRatio="9/16"
                  autoplayOnScroll
                  loop
                  muted
                  showControls={false}
                />
                <p className="text-p-sm text-[var(--muted-foreground)] mt-2 text-center">9:16 (Portrait)</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Marquee */}
      <Section title="Marquee">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Infinite scrolling content with horizontal or vertical orientation. Supports pause on hover,
          fade edges, and reverse direction. Based on the Mast framework marquee component.
        </p>
        <div className="space-y-12">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Horizontal Marquee (Default)</span>
            <Marquee pauseOnHover duration={20} gap={32}>
              <MarqueeItem>
                <Card variant="filled" className="min-w-[200px]">
                  <Icon icon={Star} size="md" color="brand" className="mb-2" />
                  <h4 className="text-h5">Feature One</h4>
                  <p className="text-p-sm text-[var(--muted-foreground)]">Seamless scrolling content</p>
                </Card>
              </MarqueeItem>
              <MarqueeItem>
                <Card variant="filled" className="min-w-[200px]">
                  <Icon icon={Heart} size="md" color="brand" className="mb-2" />
                  <h4 className="text-h5">Feature Two</h4>
                  <p className="text-p-sm text-[var(--muted-foreground)]">Pause on hover enabled</p>
                </Card>
              </MarqueeItem>
              <MarqueeItem>
                <Card variant="filled" className="min-w-[200px]">
                  <Icon icon={Lightning} size="md" color="brand" className="mb-2" />
                  <h4 className="text-h5">Feature Three</h4>
                  <p className="text-p-sm text-[var(--muted-foreground)]">Configurable speed</p>
                </Card>
              </MarqueeItem>
              <MarqueeItem>
                <Card variant="filled" className="min-w-[200px]">
                  <Icon icon={Target} size="md" color="brand" className="mb-2" />
                  <h4 className="text-h5">Feature Four</h4>
                  <p className="text-p-sm text-[var(--muted-foreground)]">Adjustable gap spacing</p>
                </Card>
              </MarqueeItem>
              <MarqueeItem>
                <Card variant="filled" className="min-w-[200px]">
                  <Icon icon={Trophy} size="md" color="brand" className="mb-2" />
                  <h4 className="text-h5">Feature Five</h4>
                  <p className="text-p-sm text-[var(--muted-foreground)]">Infinite loop animation</p>
                </Card>
              </MarqueeItem>
            </Marquee>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Reverse Direction with Fade Edges</span>
            <Marquee reverse fadeEdges pauseOnHover duration={25} gap={24}>
              <MarqueeItem>
                <div className="bg-gray-900 text-white px-6 py-3 rounded-full">
                  <span className="text-p-lg font-medium">Brand Message One</span>
                </div>
              </MarqueeItem>
              <MarqueeItem>
                <div className="bg-brand text-white px-6 py-3 rounded-full">
                  <span className="text-p-lg font-medium">Brand Message Two</span>
                </div>
              </MarqueeItem>
              <MarqueeItem>
                <div className="bg-blue text-white px-6 py-3 rounded-full">
                  <span className="text-p-lg font-medium">Brand Message Three</span>
                </div>
              </MarqueeItem>
              <MarqueeItem>
                <div className="bg-gray-900 text-white px-6 py-3 rounded-full">
                  <span className="text-p-lg font-medium">Brand Message Four</span>
                </div>
              </MarqueeItem>
              <MarqueeItem>
                <div className="bg-brand text-white px-6 py-3 rounded-full">
                  <span className="text-p-lg font-medium">Brand Message Five</span>
                </div>
              </MarqueeItem>
            </Marquee>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Vertical Marquee (Scrolling Down)</span>
              <div className="h-[300px] overflow-hidden rounded-lg border border-[var(--primary-border)]">
                <Marquee orientation="vertical" pauseOnHover duration={15} gap={16}>
                  <MarqueeItem>
                    <Card variant="outline" className="w-full">
                      <div className="flex items-center gap-3">
                        <Icon icon={CheckCircle} size="sm" color="brand" />
                        <span className="text-body">Vertical item one</span>
                      </div>
                    </Card>
                  </MarqueeItem>
                  <MarqueeItem>
                    <Card variant="outline" className="w-full">
                      <div className="flex items-center gap-3">
                        <Icon icon={CheckCircle} size="sm" color="brand" />
                        <span className="text-body">Vertical item two</span>
                      </div>
                    </Card>
                  </MarqueeItem>
                  <MarqueeItem>
                    <Card variant="outline" className="w-full">
                      <div className="flex items-center gap-3">
                        <Icon icon={CheckCircle} size="sm" color="brand" />
                        <span className="text-body">Vertical item three</span>
                      </div>
                    </Card>
                  </MarqueeItem>
                  <MarqueeItem>
                    <Card variant="outline" className="w-full">
                      <div className="flex items-center gap-3">
                        <Icon icon={CheckCircle} size="sm" color="brand" />
                        <span className="text-body">Vertical item four</span>
                      </div>
                    </Card>
                  </MarqueeItem>
                </Marquee>
              </div>
            </div>
            <div>
              <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Vertical Reverse (Scrolling Up)</span>
              <div className="h-[300px] overflow-hidden rounded-lg border border-[var(--primary-border)]">
                <Marquee orientation="vertical" reverse fadeEdges pauseOnHover duration={15} gap={16}>
                  <MarqueeItem>
                    <Card variant="filled" className="w-full">
                      <div className="flex items-center gap-3">
                        <Icon icon={Star} size="sm" color="brand" />
                        <span className="text-body">Reverse item one</span>
                      </div>
                    </Card>
                  </MarqueeItem>
                  <MarqueeItem>
                    <Card variant="filled" className="w-full">
                      <div className="flex items-center gap-3">
                        <Icon icon={Star} size="sm" color="brand" />
                        <span className="text-body">Reverse item two</span>
                      </div>
                    </Card>
                  </MarqueeItem>
                  <MarqueeItem>
                    <Card variant="filled" className="w-full">
                      <div className="flex items-center gap-3">
                        <Icon icon={Star} size="sm" color="brand" />
                        <span className="text-body">Reverse item three</span>
                      </div>
                    </Card>
                  </MarqueeItem>
                  <MarqueeItem>
                    <Card variant="filled" className="w-full">
                      <div className="flex items-center gap-3">
                        <Icon icon={Star} size="sm" color="brand" />
                        <span className="text-body">Reverse item four</span>
                      </div>
                    </Card>
                  </MarqueeItem>
                </Marquee>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Card */}
      <Section title="Card">
        <p className="text-p-lg text-[var(--muted-foreground)] mb-8">
          Flexible card container that can hold any content. Supports multiple style variants,
          responsive padding, and optional link functionality.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Style Variants</span>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card variant="default">
                <h4 className="text-h4 mb-2">Default</h4>
                <p className="text-body text-[var(--muted-foreground)]">White background with border</p>
              </Card>
              <Card variant="outline">
                <h4 className="text-h4 mb-2">Outline</h4>
                <p className="text-body text-[var(--muted-foreground)]">Transparent with border</p>
              </Card>
              <Card variant="filled">
                <h4 className="text-h4 mb-2">Filled</h4>
                <p className="text-body text-[var(--muted-foreground)]">Gray background</p>
              </Card>
              <Card variant="ghost">
                <h4 className="text-h4 mb-2">Ghost</h4>
                <p className="text-body text-[var(--muted-foreground)]">No background or border</p>
              </Card>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Simplified Padding (uses CSS variables for fluid sizing)</span>
            <div className="grid md:grid-cols-4 gap-6">
              <Card padding="none">
                <h4 className="text-h5 mb-2">None</h4>
                <p className="text-p-sm text-[var(--muted-foreground)]">padding=&quot;none&quot;</p>
              </Card>
              <Card padding="sm">
                <h4 className="text-h5 mb-2">Small</h4>
                <p className="text-p-sm text-[var(--muted-foreground)]">padding=&quot;sm&quot;</p>
              </Card>
              <Card padding="md">
                <h4 className="text-h5 mb-2">Medium (Default)</h4>
                <p className="text-p-sm text-[var(--muted-foreground)]">padding=&quot;md&quot;</p>
              </Card>
              <Card padding="lg">
                <h4 className="text-h5 mb-2">Large</h4>
                <p className="text-p-sm text-[var(--muted-foreground)]">padding=&quot;lg&quot;</p>
              </Card>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Clickable Cards (with hover effect)</span>
            <div className="grid md:grid-cols-3 gap-6">
              <Card href="/design-system" hoverEffect>
                <h4 className="text-h5 mb-2">Internal Link</h4>
                <p className="text-p-sm text-[var(--muted-foreground)]">Navigates within the app using Next.js Link</p>
              </Card>
              <Card href="https://example.com" openInNewTab hoverEffect>
                <h4 className="text-h5 mb-2">External Link</h4>
                <p className="text-p-sm text-[var(--muted-foreground)]">Opens in new tab with proper security attributes</p>
              </Card>
              <Card variant="filled" href="/design-system" hoverEffect>
                <h4 className="text-h5 mb-2">Filled + Linked</h4>
                <p className="text-p-sm text-[var(--muted-foreground)]">Combines variant with link functionality</p>
              </Card>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-[var(--muted-foreground)] mb-4 block">Cards with Mixed Content</span>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <Icon icon={Star} size="lg" color="brand" className="mb-4" />
                <h4 className="text-h4 mb-2">Feature Card</h4>
                <p className="text-body text-[var(--muted-foreground)] mb-4">
                  Cards can contain any combination of icons, headings, text, buttons, and more.
                </p>
                <Button variant="primary" colorScheme="brand">
                  Learn More <ArrowRight className="h-4 w-4 ml-2" weight="bold" />
                </Button>
              </Card>
              <Card variant="filled" padding="lg">
                <div className="flex items-start gap-4">
                  <Icon icon={CheckCircle} size="md" color="brand" />
                  <div>
                    <h4 className="text-h5 mb-1">Testimonial Card</h4>
                    <p className="text-body text-[var(--muted-foreground)] mb-2">
                      &quot;This design system has made our workflow so much more efficient.&quot;
                    </p>
                    <p className="text-p-sm text-[var(--muted-foreground)]">— Happy Customer</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Section>

      {/* Spacing */}
      <Section title="Spacing Scale">
        <div className="space-y-4">
          {[2, 4, 6, 8, 12, 16, 24].map((size) => (
            <div key={size} className="flex items-center gap-4">
              <span className="text-sm text-[var(--muted-foreground)] w-20">Space {size}</span>
              <div
                className="bg-brand"
                style={{height: `${size * 4}px`, width: `${size * 4}px`}}
              />
              <span className="text-xs text-gray-300">{size * 4}px</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Border Radius */}
      <Section title="Border Radius">
        <div className="flex flex-wrap gap-8">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-[var(--muted-background)] rounded-none" />
            <span className="text-sm mt-2">None</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-[var(--muted-background)] rounded" />
            <span className="text-sm mt-2">SM (4px)</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-[var(--muted-background)] rounded-lg" />
            <span className="text-sm mt-2">MD (8px)</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-[var(--muted-background)] rounded-2xl" />
            <span className="text-sm mt-2">LG (16px)</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-[var(--muted-background)] rounded-full" />
            <span className="text-sm mt-2">Full</span>
          </div>
        </div>
      </Section>

      {/* Shadows */}
      <Section title="Shadows">
        <div className="flex flex-wrap gap-8">
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-lg shadow-sm" />
            <span className="text-sm mt-4">Shadow SM</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-lg shadow" />
            <span className="text-sm mt-4">Shadow Default</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-lg shadow-md" />
            <span className="text-sm mt-4">Shadow MD</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-lg shadow-lg" />
            <span className="text-sm mt-4">Shadow LG</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-lg shadow-xl" />
            <span className="text-sm mt-4">Shadow XL</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-white rounded-lg shadow-layer" />
            <span className="text-sm mt-4">Shadow Layer</span>
          </div>
        </div>
      </Section>

      {/* Component Reference */}
      <Section title="Component Reference">
        <div className="prose max-w-none">
          <p className="text-[var(--muted-foreground)] mb-8">
            The following Sanity block components are available for use within Section → Row →
            Column layouts:
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'HeadingBlock',
                description: 'Semantic headings (h1-h6) with independent visual sizing',
                props: ['level', 'size', 'align', 'color'],
              },
              {
                name: 'RichTextBlock',
                description: 'Portable Text content with alignment and max-width controls',
                props: ['align', 'maxWidth'],
              },
              {
                name: 'ButtonBlock',
                description: 'Call-to-action buttons with variant and color options',
                props: ['variant', 'color', 'icon'],
              },
              {
                name: 'ImageBlock',
                description: 'Responsive images with aspect ratio and styling controls',
                props: ['size', 'aspectRatio', 'rounded', 'shadow'],
              },
              {
                name: 'IconBlock',
                description: 'Phosphor icons with size, color, and weight options',
                props: ['icon', 'size', 'color', 'weight', 'marginBottom'],
              },
              {
                name: 'SpacerBlock',
                description: 'Vertical spacing with responsive desktop/mobile sizes',
                props: ['sizeDesktop', 'sizeMobile'],
              },
              {
                name: 'DividerBlock',
                description: 'Horizontal rule with configurable top/bottom spacing and colors',
                props: ['marginTop', 'marginBottom', 'color'],
              },
              {
                name: 'CardBlock',
                description: 'Flexible container for other blocks with responsive padding and optional link',
                props: ['variant', 'paddingDesktop', 'paddingMobile', 'href', 'hoverEffect'],
              },
              {
                name: 'EyebrowBlock',
                description: 'Small uppercase text with text, overline, or pill variants',
                props: ['text', 'variant', 'color', 'align'],
              },
              {
                name: 'BreadcrumbBlock',
                description: 'Navigation breadcrumbs with customizable separator style',
                props: ['items', 'separator', 'align'],
              },
              {
                name: 'AccordionBlock',
                description: 'Collapsible FAQ sections with native details/summary elements',
                props: ['items', 'titleStyle', 'showDividers', 'allowMultiple'],
              },
              {
                name: 'TableBlock',
                description: 'Data table with columns, rows, and style variants',
                props: ['columns', 'rows', 'variant', 'showHeader', 'caption'],
              },
              {
                name: 'SliderBlock',
                description: 'Responsive carousel with navigation position, effects, and autoplay',
                props: ['slides', 'slidesPerView', 'gap', 'navigationPosition', 'effect', 'autoplay'],
              },
              {
                name: 'TabsBlock',
                description: 'Tab navigation with menu positioning, autoplay with progress, and mobile dropdown',
                props: ['tabs', 'orientation', 'menuPosition', 'mobileDropdown', 'autoplay', 'showProgress'],
              },
              {
                name: 'ModalBlock',
                description: 'Dialog overlay for content or YouTube video lightbox',
                props: ['triggerLabel', 'triggerVariant', 'contentType', 'modalSize', 'modalId'],
              },
              {
                name: 'InlineVideoBlock',
                description: 'Embedded video with lazy loading and autoplay on scroll',
                props: ['videoFile', 'videoUrl', 'poster', 'aspectRatio', 'autoplayOnScroll'],
              },
              {
                name: 'MarqueeBlock',
                description: 'Infinite scrolling content with horizontal/vertical orientation',
                props: ['items', 'orientation', 'reverse', 'pauseOnHover', 'fadeEdges', 'duration', 'gap'],
              },
            ].map((component) => (
              <div key={component.name} className="border border-[var(--primary-border)] rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-2">{component.name}</h4>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">{component.description}</p>
                <div className="flex flex-wrap gap-2">
                  {component.props.map((prop) => (
                    <span
                      key={prop}
                      className="text-xs bg-[var(--muted-background)] text-[var(--primary-foreground)] px-2 py-1 rounded"
                    >
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Layout Components */}
      <Section title="Layout Components">
        <div className="prose max-w-none">
          <p className="text-[var(--muted-foreground)] mb-8">
            The page builder uses a hierarchical Section → Row → Column structure for flexible
            layouts:
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Section',
                description:
                  'Top-level container with background color, max-width, and padding controls',
                props: ['backgroundColor', 'maxWidth', 'paddingTop', 'paddingBottom', 'paddingX'],
              },
              {
                name: 'Row',
                description:
                  'Flex container with alignment, gap, and mobile reverse options',
                props: ['horizontalAlign', 'verticalAlign', 'gap', 'wrap', 'reverseOnMobile'],
              },
              {
                name: 'Column',
                description:
                  '12-column grid cell with responsive width and internal padding',
                props: ['widthDesktop', 'widthTablet', 'widthMobile', 'verticalAlign', 'padding'],
              },
            ].map((component) => (
              <div key={component.name} className="border border-[var(--primary-border)] rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-2">{component.name}</h4>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">{component.description}</p>
                <div className="flex flex-wrap gap-2">
                  {component.props.map((prop) => (
                    <span
                      key={prop}
                      className="text-xs bg-[var(--muted-background)] text-[var(--primary-foreground)] px-2 py-1 rounded"
                    >
                      {prop}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  )
}
