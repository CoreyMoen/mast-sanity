import {Button} from '@/app/components/ui/button'
import {ArrowRight, Download, ExternalLink} from 'lucide-react'

export const metadata = {
  title: 'Design System',
  description: 'Visual overview of all design system components, colors, and typography',
}

// Color definitions from the theme
const colors = {
  primary: [
    {name: 'Black', value: '#0b0b0b', textClass: 'text-white'},
    {name: 'White', value: '#fff', textClass: 'text-black', border: true},
    {name: 'Brand', value: '#f50', textClass: 'text-white'},
    {name: 'Blue', value: '#0052ff', textClass: 'text-white'},
    {name: 'Yellow', value: '#cdea19', textClass: 'text-black'},
  ],
  gray: [
    {name: 'Gray 50', value: '#f6f6f8', textClass: 'text-black'},
    {name: 'Gray 100', value: '#eeeef1', textClass: 'text-black'},
    {name: 'Gray 200', value: '#e3e4e8', textClass: 'text-black'},
    {name: 'Gray 300', value: '#bbbdc9', textClass: 'text-black'},
    {name: 'Gray 400', value: '#9499ad', textClass: 'text-black'},
    {name: 'Gray 500', value: '#727892', textClass: 'text-white'},
    {name: 'Gray 600', value: '#515870', textClass: 'text-white'},
    {name: 'Gray 700', value: '#383d51', textClass: 'text-white'},
    {name: 'Gray 800', value: '#252837', textClass: 'text-white'},
    {name: 'Gray 900', value: '#1b1d27', textClass: 'text-white'},
    {name: 'Gray 950', value: '#13141b', textClass: 'text-white'},
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
    <section className={`py-12 px-8 ${dark ? 'bg-gray-900 text-white' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 pb-4 border-b border-gray-200">{title}</h2>
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
      <div className="bg-gray-50 py-16 px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Design System</h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            A comprehensive overview of typography, colors, and components used throughout the
            project.
          </p>
        </div>
      </div>

      {/* Typography */}
      <Section title="Typography">
        <div className="space-y-8">
          <div>
            <span className="text-sm text-gray-500 mb-2 block">XL - Display</span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              The quick brown fox jumps
            </h1>
          </div>
          <div>
            <span className="text-sm text-gray-500 mb-2 block">LG - Heading 1</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
              The quick brown fox jumps over
            </h2>
          </div>
          <div>
            <span className="text-sm text-gray-500 mb-2 block">MD - Heading 2</span>
            <h3 className="text-2xl md:text-3xl font-bold">
              The quick brown fox jumps over the lazy dog
            </h3>
          </div>
          <div>
            <span className="text-sm text-gray-500 mb-2 block">SM - Heading 3</span>
            <h4 className="text-xl md:text-2xl font-semibold">
              The quick brown fox jumps over the lazy dog
            </h4>
          </div>
          <div>
            <span className="text-sm text-gray-500 mb-2 block">XS - Heading 4</span>
            <h5 className="text-lg md:text-xl font-semibold">
              The quick brown fox jumps over the lazy dog
            </h5>
          </div>
          <div>
            <span className="text-sm text-gray-500 mb-2 block">Body - Base</span>
            <p className="text-base">
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
              How vexingly quick daft zebras jump!
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500 mb-2 block">Body - Small</span>
            <p className="text-sm">
              The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
              How vexingly quick daft zebras jump!
            </p>
          </div>
        </div>
      </Section>

      {/* Colors */}
      <Section title="Colors - Primary">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {colors.primary.map((color) => (
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
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="primary" colorScheme="brand">
                External <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="primary" colorScheme="blue">
                Download <Download className="h-4 w-4 ml-2" />
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
                With Icon <ArrowRight className="h-4 w-4 ml-2" />
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
