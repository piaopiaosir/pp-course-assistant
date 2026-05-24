export default function Footer() {
  return (
    <footer className="relative border-t border-brand-light-gray bg-brand-dark/[0.015]">
      <div className="section-container py-12 sm:py-16 md:py-20">
        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          <p className="text-xs sm:text-sm font-body text-brand-dark/25 text-center md:text-left">
            &copy; {new Date().getFullYear()} 网课小助手
          </p>
          <p className="text-xs font-body text-brand-dark/20 text-center md:text-right">
            Designed with care · Built for efficiency
          </p>
        </div>
      </div>
    </footer>
  )
}
