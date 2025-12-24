import {Button} from '@/app/components/ui/button'
import {Icon} from '@/app/components/ui/icon'
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/app/components/ui/accordion'
import {Divider} from '@/app/components/ui/divider'
import {Card} from '@/app/components/ui/card'
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
    <section className={`py-12 ${dark ? 'bg-gray-900 text-white' : ''}`}>
      <div className="container">
        <h2 className="text-h3 mb-8 pb-4 border-b border-gray-200">{title}</h2>
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
        className={`h-16 w-full rounded-lg flex items-end p-2 ${textClass} ${border ? 'border border-gray-200' : ''}`}
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gray-50 py-16">
        <div className="container">
          <h1 className="text-h1 mb-4">Design System</h1>
          <p className="text-p-xl text-gray-600 max-w-3xl">
            Based on the Mast framework. Features General Sans typography, fluid sizing with CSS clamp(),
            Phosphor icons, and a max-width container (90rem) with 6vw responsive gutters.
          </p>
        </div>
      </div>

      {/* Font Info */}
      <Section title="Typography - Font">
        <div className="flex flex-wrap gap-8 items-center">
          <div className="flex-1 min-w-[200px]">
            <p className="text-p-sm text-gray-500 mb-2">Primary Font</p>
            <p className="text-h2">General Sans</p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="text-p-sm text-gray-500 mb-2">Regular (400)</p>
              <p className="text-h4 font-normal">Aa Bb Cc 123</p>
            </div>
            <div>
              <p className="text-p-sm text-gray-500 mb-2">Medium (500)</p>
              <p className="text-h4 font-medium">Aa Bb Cc 123</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Typography - Headings */}
      <Section title="Typography - Headings (Fluid)">
        <p className="text-p-lg text-gray-600 mb-8">
          All typography uses CSS clamp() for fluid scaling between viewport widths 320px - 1440px.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-gray-500 mb-2 block">H1 — clamp(2.8rem → 5.5rem) / 44-88px</span>
            <h1 className="text-h1">The quick brown fox jumps</h1>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-2 block">H2 — clamp(2rem → 3.8rem) / 32-61px</span>
            <h2 className="text-h2">The quick brown fox jumps over</h2>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-2 block">H3 — clamp(1.5rem → 2.3rem) / 24-37px</span>
            <h3 className="text-h3">The quick brown fox jumps over the lazy dog</h3>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-2 block">H4 — clamp(1.3rem → 1.5rem) / 21-24px</span>
            <h4 className="text-h4">The quick brown fox jumps over the lazy dog</h4>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-2 block">H5 — clamp(1.1rem → 1.2rem) / 18-19px</span>
            <h5 className="text-h5">The quick brown fox jumps over the lazy dog</h5>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-2 block">H6 — clamp(0.9rem → 1rem) / 14-16px</span>
            <h6 className="text-h6">The quick brown fox jumps over the lazy dog</h6>
          </div>
        </div>
      </Section>

      {/* Typography - Paragraphs */}
      <Section title="Typography - Paragraphs (Fluid)">
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-gray-500 mb-2 block">Paragraph XL — clamp(1.2rem → 1.5rem) / 19-24px</span>
            <p className="text-p-xl">
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
              How vexingly quick daft zebras jump!
            </p>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-2 block">Paragraph LG — clamp(1.1rem → 1.25rem) / 18-20px</span>
            <p className="text-p-lg">
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
              How vexingly quick daft zebras jump!
            </p>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-2 block">Body (Default) — clamp(0.9rem → 1rem) / 14-16px</span>
            <p className="text-body">
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
              How vexingly quick daft zebras jump!
            </p>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-2 block">Paragraph SM — clamp(0.8rem → 0.9rem) / 13-14px</span>
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

      {/* Buttons */}
      <Section title="Buttons - Primary Variant">
        <div className="space-y-8">
          <div>
            <span className="text-sm text-gray-500 mb-4 block">Color Schemes</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" colorScheme="black">
                Black
              </Button>
              <Button variant="primary" colorScheme="brand">
                Brand
              </Button>
              <Button variant="primary" colorScheme="blue">
                Blue
              </Button>
              <Button variant="primary" colorScheme="white" className="border border-gray-200">
                White
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500 mb-4 block">Sizes</span>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" colorScheme="black" size="sm">
                Small
              </Button>
              <Button variant="primary" colorScheme="black" size="md">
                Medium
              </Button>
              <Button variant="primary" colorScheme="black" size="lg">
                Large
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500 mb-4 block">With Icons</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" colorScheme="black">
                Continue <ArrowRight className="h-4 w-4 ml-2" weight="bold" />
              </Button>
              <Button variant="primary" colorScheme="brand">
                External <ArrowUpRight className="h-4 w-4 ml-2" weight="bold" />
              </Button>
              <Button variant="primary" colorScheme="blue">
                Download <Download className="h-4 w-4 ml-2" weight="bold" />
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Buttons - Secondary Variant">
        <div className="space-y-8">
          <div>
            <span className="text-sm text-gray-500 mb-4 block">Color Schemes</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" colorScheme="black">
                Black
              </Button>
              <Button variant="secondary" colorScheme="brand">
                Brand
              </Button>
              <Button variant="secondary" colorScheme="blue">
                Blue
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500 mb-4 block">Sizes</span>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="secondary" colorScheme="black" size="sm">
                Small
              </Button>
              <Button variant="secondary" colorScheme="black" size="md">
                Medium
              </Button>
              <Button variant="secondary" colorScheme="black" size="lg">
                Large
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Buttons - Ghost Variant">
        <div className="space-y-8">
          <div>
            <span className="text-sm text-gray-500 mb-4 block">Color Schemes</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="ghost" colorScheme="black">
                Black
              </Button>
              <Button variant="ghost" colorScheme="brand">
                Brand
              </Button>
              <Button variant="ghost" colorScheme="blue">
                Blue
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-500 mb-4 block">Sizes</span>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="ghost" colorScheme="black" size="sm">
                Small
              </Button>
              <Button variant="ghost" colorScheme="black" size="md">
                Medium
              </Button>
              <Button variant="ghost" colorScheme="black" size="lg">
                Large
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Buttons on Dark Background */}
      <Section title="Buttons - On Dark Background" dark>
        <div className="space-y-8">
          <div>
            <span className="text-sm text-gray-400 mb-4 block">Primary White</span>
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
            <span className="text-sm text-gray-400 mb-4 block">Secondary White</span>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" colorScheme="white">
                White Outline
              </Button>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-400 mb-4 block">Ghost White</span>
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
        <p className="text-p-lg text-gray-600 mb-8">
          Uses the Phosphor icon library. Icons support multiple sizes and colors.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">Sizes</span>
            <div className="flex flex-wrap items-end gap-8">
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Star} size="xs" />
                <span className="text-p-sm text-gray-500">XS (16px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Star} size="sm" />
                <span className="text-p-sm text-gray-500">SM (24px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Star} size="md" />
                <span className="text-p-sm text-gray-500">MD (32px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Star} size="lg" />
                <span className="text-p-sm text-gray-500">LG (48px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Star} size="xl" />
                <span className="text-p-sm text-gray-500">XL (64px)</span>
              </div>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">Colors</span>
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
            <span className="text-p-sm text-gray-500 mb-4 block">Weights</span>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="thin" />
                <span className="text-p-sm text-gray-500">Thin</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="light" />
                <span className="text-p-sm text-gray-500">Light</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="regular" />
                <span className="text-p-sm text-gray-500">Regular</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="bold" />
                <span className="text-p-sm text-gray-500">Bold</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="fill" />
                <span className="text-p-sm text-gray-500">Fill</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Icon icon={Heart} size="lg" weight="duotone" />
                <span className="text-p-sm text-gray-500">Duotone</span>
              </div>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">Sample Icons</span>
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
        <p className="text-p-lg text-gray-600 mb-8">
          Collapsible content sections. Supports single or multiple open items, and can start with items open.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">Single (collapsible)</span>
            <Accordion type="single" collapsible className="w-full max-w-xl">
              <AccordionItem value="item-1">
                <AccordionTrigger>What is fluid typography?</AccordionTrigger>
                <AccordionContent>
                  Fluid typography uses CSS clamp() to smoothly scale font sizes between a minimum and maximum
                  value based on the viewport width, eliminating abrupt size changes at breakpoints.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How does the container work?</AccordionTrigger>
                <AccordionContent>
                  The container has a max-width of 90rem (1440px) with 6vw responsive gutters on each side.
                  Below the max-width, it fills 100% of the viewport minus the gutters.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>What icon library is used?</AccordionTrigger>
                <AccordionContent>
                  We use Phosphor Icons, a flexible icon family with multiple weights (thin, light, regular,
                  bold, fill, duotone) and consistent sizing.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">With default open item</span>
            <Accordion type="single" collapsible defaultValue="open-item" className="w-full max-w-xl">
              <AccordionItem value="open-item">
                <AccordionTrigger>This starts open</AccordionTrigger>
                <AccordionContent>
                  Use the defaultValue prop to specify which item should be open by default.
                  This is useful for FAQ sections where you want to highlight the first answer.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="closed-item">
                <AccordionTrigger>This starts closed</AccordionTrigger>
                <AccordionContent>
                  Other items remain closed until clicked.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">Multiple open at once</span>
            <Accordion type="multiple" className="w-full max-w-xl">
              <AccordionItem value="multi-1">
                <AccordionTrigger>First section</AccordionTrigger>
                <AccordionContent>
                  With type=&quot;multiple&quot;, multiple sections can be open simultaneously.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="multi-2">
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
        <p className="text-p-lg text-gray-600 mb-8">
          Horizontal rule with configurable spacing and colors using the project&apos;s spacing scale.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">Default</span>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-body">Content above the divider</p>
              <Divider />
              <p className="text-body">Content below the divider</p>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">Colors</span>
            <div className="bg-gray-50 p-6 rounded-lg space-y-1">
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
            <span className="text-p-sm text-gray-500 mb-4 block">Spacing variations</span>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-p-sm text-gray-500">marginTop=&quot;0&quot; marginBottom=&quot;0&quot;</p>
              <Divider marginTop="0" marginBottom="0" />
              <p className="text-p-sm text-gray-500">marginTop=&quot;4&quot; marginBottom=&quot;4&quot;</p>
              <Divider marginTop="4" marginBottom="4" />
              <p className="text-p-sm text-gray-500">marginTop=&quot;8&quot; marginBottom=&quot;8&quot; (default)</p>
              <Divider marginTop="8" marginBottom="8" />
              <p className="text-p-sm text-gray-500">marginTop=&quot;16&quot; marginBottom=&quot;16&quot;</p>
              <Divider marginTop="16" marginBottom="16" />
              <p className="text-p-sm text-gray-500">End of examples</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Card */}
      <Section title="Card">
        <p className="text-p-lg text-gray-600 mb-8">
          Flexible card container that can hold any content. Supports multiple style variants,
          responsive padding, and optional link functionality.
        </p>
        <div className="space-y-8">
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">Style Variants</span>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card variant="default">
                <h4 className="text-h4 mb-2">Default</h4>
                <p className="text-body text-gray-600">White background with border</p>
              </Card>
              <Card variant="outline">
                <h4 className="text-h4 mb-2">Outline</h4>
                <p className="text-body text-gray-600">Transparent with border</p>
              </Card>
              <Card variant="filled">
                <h4 className="text-h4 mb-2">Filled</h4>
                <p className="text-body text-gray-600">Gray background</p>
              </Card>
              <Card variant="ghost">
                <h4 className="text-h4 mb-2">Ghost</h4>
                <p className="text-body text-gray-600">No background or border</p>
              </Card>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">Padding Options (Desktop / Mobile)</span>
            <div className="grid md:grid-cols-3 gap-6">
              <Card paddingDesktop="4" paddingMobile="4">
                <h4 className="text-h5 mb-2">Small Padding</h4>
                <p className="text-p-sm text-gray-600">paddingDesktop=&quot;4&quot; paddingMobile=&quot;4&quot;</p>
              </Card>
              <Card paddingDesktop="6" paddingMobile="4">
                <h4 className="text-h5 mb-2">Medium Padding (Default)</h4>
                <p className="text-p-sm text-gray-600">paddingDesktop=&quot;6&quot; paddingMobile=&quot;4&quot;</p>
              </Card>
              <Card paddingDesktop="12" paddingMobile="8">
                <h4 className="text-h5 mb-2">Large Padding</h4>
                <p className="text-p-sm text-gray-600">paddingDesktop=&quot;12&quot; paddingMobile=&quot;8&quot;</p>
              </Card>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">Clickable Cards (with hover effect)</span>
            <div className="grid md:grid-cols-3 gap-6">
              <Card href="/design-system" hoverEffect>
                <h4 className="text-h5 mb-2">Internal Link</h4>
                <p className="text-p-sm text-gray-600">Navigates within the app using Next.js Link</p>
              </Card>
              <Card href="https://example.com" openInNewTab hoverEffect>
                <h4 className="text-h5 mb-2">External Link</h4>
                <p className="text-p-sm text-gray-600">Opens in new tab with proper security attributes</p>
              </Card>
              <Card variant="filled" href="/design-system" hoverEffect>
                <h4 className="text-h5 mb-2">Filled + Linked</h4>
                <p className="text-p-sm text-gray-600">Combines variant with link functionality</p>
              </Card>
            </div>
          </div>
          <div>
            <span className="text-p-sm text-gray-500 mb-4 block">Cards with Mixed Content</span>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <Icon icon={Star} size="lg" color="brand" className="mb-4" />
                <h4 className="text-h4 mb-2">Feature Card</h4>
                <p className="text-body text-gray-600 mb-4">
                  Cards can contain any combination of icons, headings, text, buttons, and more.
                </p>
                <Button variant="primary" colorScheme="brand" size="sm">
                  Learn More <ArrowRight className="h-4 w-4 ml-2" weight="bold" />
                </Button>
              </Card>
              <Card variant="filled" paddingDesktop="8" paddingMobile="6">
                <div className="flex items-start gap-4">
                  <Icon icon={CheckCircle} size="md" color="brand" />
                  <div>
                    <h4 className="text-h5 mb-1">Testimonial Card</h4>
                    <p className="text-body text-gray-600 mb-2">
                      &quot;This design system has made our workflow so much more efficient.&quot;
                    </p>
                    <p className="text-p-sm text-gray-500">— Happy Customer</p>
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
              <span className="text-sm text-gray-500 w-20">Space {size}</span>
              <div
                className="bg-brand"
                style={{height: `${size * 4}px`, width: `${size * 4}px`}}
              />
              <span className="text-xs text-gray-400">{size * 4}px</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Border Radius */}
      <Section title="Border Radius">
        <div className="flex flex-wrap gap-8">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-200 rounded-none" />
            <span className="text-sm mt-2">None</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-200 rounded" />
            <span className="text-sm mt-2">SM (4px)</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-200 rounded-lg" />
            <span className="text-sm mt-2">MD (8px)</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-200 rounded-2xl" />
            <span className="text-sm mt-2">LG (16px)</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full" />
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
          <p className="text-gray-600 mb-8">
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
                description: 'Call-to-action buttons with variant, color, and size options',
                props: ['variant', 'color', 'size', 'align', 'icon'],
              },
              {
                name: 'ImageBlock',
                description: 'Responsive images with aspect ratio and styling controls',
                props: ['size', 'aspectRatio', 'rounded', 'shadow'],
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
            ].map((component) => (
              <div key={component.name} className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-2">{component.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{component.description}</p>
                <div className="flex flex-wrap gap-2">
                  {component.props.map((prop) => (
                    <span
                      key={prop}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
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
          <p className="text-gray-600 mb-8">
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
              <div key={component.name} className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-2">{component.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{component.description}</p>
                <div className="flex flex-wrap gap-2">
                  {component.props.map((prop) => (
                    <span
                      key={prop}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
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
