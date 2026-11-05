export function ResumePage() {
  return (
    <main className="resume">
      <div className="display-bg" />
      <header className="resume-logos">
        <img src="/ecw-logo.png" alt="Education Cannot Wait" />
        <img src="/hsh-logo.svg" alt="Hope Starts Here" />
      </header>
      <div className="resume-sheet">
        <p className="resume-total">
          541,600,000
          <span className="resume-usd">(USD)</span>
        </p>
        <div className="resume-split">
          <article>
            <p className="resume-amount">
              60,000,000
              <span className="resume-usd">(USD)</span>
            </p>
            <p className="resume-note">
              to the education in emergencies sector
              <br />
              from <span className="resume-mark">Education Bridging Fund</span>
            </p>
          </article>
          <article>
            <p className="resume-amount">
              UP TO 1M
              <span className="resume-usd">(USD)</span>
            </p>
            <p className="resume-note">
              to Education Cannot Wait from the
              <br />
              <span className="resume-mark">Cantonal Banks</span>
            </p>
          </article>
        </div>
      </div>
      <footer className="resume-footer">
        <span>www.educationcannotwait.org</span>
        <span>High-Level Replenishment Conference 2026</span>
        <span>#HopeStartsHere</span>
      </footer>
    </main>
  )
}
