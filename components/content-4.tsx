import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function ContentSection() {
    return (
        <section id="about" className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-6 md:grid-cols-2 md:gap-12">
                    <h2 className="text-4xl font-medium">Our platform brings together intelligent code analysis and developer tools in one place.</h2>
                    <div className="space-y-6">
                        <p>It’s more than just an AI model it’s a complete ecosystem designed to help developers write cleaner, safer, and better code.</p>
                        <p>
                        <span className="font-bold">From realtime reviews to smart suggestions and integrations, we help teams build faster and ship with confidence.</span> </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
