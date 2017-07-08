
const parser = (input) => {
  const sourcesSection = '#### Sources'
  const headings = {
    meetup: '##### Meetup',
    workshop: '##### Workshop',
    conference: '##### Conference',
    hackathon: '##### Hackathon'
  }

  // Scrape title
  // ## June 2017 => ['June 2017', ...]
  const titlePattern = /^##\s(\w+)\s(\d+)/img
  const titlesRaw = input.match(titlePattern)
  const titles = titlesRaw.map((title) => title.replace(/#/g, '').trim())

  // Scrape each section (everything in between two different months)
  const sectionsRaw = titlesRaw.map((title, index) => {
    const start = title
    const end = titlesRaw[index + 1] ? titlesRaw[index + 1] : sourcesSection
    const pattern = captureMiddlePattern(start, end)
    const output = pattern.exec(input)
    if (output && output.length > 0) {
      return output[1].trim()
    }
    return output
  })

  const sections = sectionsRaw.map((section, index) => {
    const headingPatterns = /####\s(\w+)/img
    const headingsRaw = section.match(headingPatterns)
    if (headingsRaw) {
      const parsedSection = headingsRaw.map((heading, index) => {
        const start = heading
        const cleanHeading = start.replace('#### ', '')
        const end = headings[index + 1] ? headings[index + 1] : ''
        if (end === '') {
            // There is no end, so take everything
          const result = section.split(start)[1]
          return [cleanHeading, result]
        }
        const pattern = captureMiddlePattern(start, end)
        const output = pattern.exec(section)
        if (output && output.length > 0) {
          return [cleanHeading, output[1].trim()]
        }
        return [cleanHeading, output]
      })
      return parsedSection.map(([type, section]) => {
        const eventPattern = /\+\s(.+)/img
        const eventsRaw = section.match(eventPattern)
        if (!eventsRaw) return null

        const events = eventsRaw.map(event => {
          const infoPattern = /^\+\s(.+?)\s-\s\[(.+?)\]\((.+?)\)/ig
          const results = infoPattern.exec(event)
          if (!results) {
            return null
          }

          const month = getMonths(titles[index].split(' ')[0])
          const year = titles[index].split(' ')[1]
          const datePattern = /(\d+)/ig
          const date = results[1].match(datePattern)

          return {
            datetime: new Date(year, month, date),
            title: results[2],
            url: results[3],
            type: type
          }
        })
        return events
      })
    }
    const eventPattern = /\+\s(.+)/img
    const eventsRaw = section.match(eventPattern)

    const events = eventsRaw.map(event => {
      const infoPattern = /^\+\s(.+?)\s-\s\[(.+?)\]\((.+?)\)/ig
      const results = infoPattern.exec(event)
      if (!results) {
        return null
      }

      const month = getMonths(titles[index].split(' ')[0])
      const year = titles[index].split(' ')[1]
      const datePattern = /(\d+)/ig
      const date = results[1].match(datePattern)

      return {
        datetime: new Date(year, month, date),
        title: results[2],
        url: results[3],
        type: ''
      }
    })
    return events
  })

  return {
    titles: titles,
    sections: sections
  }
}

// Return the integer month provided a string month e.g. 'January' -> 0
function getMonths (month) {
  if (!month) {
    return ''
  }
  const index = month.slice(0, 3).toLowerCase()
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  return months.indexOf(index)
}
// Utils to create a simple regex that matches everything in between two patterns and excludes the start and end pattern
function captureMiddlePattern (start, end) {
  // Replace white spaces with the regex pattern \s
  const startPattern = excludePattern(start.replace(/\s/g, '\\s'))
  const endPattern = excludePattern(end.replace(/\s/g, '\\s'))

  // Double backward slash is required to escape the backward slash
  return new RegExp(startPattern + '([\\s\\S]*?)' + endPattern, 'igm')
}

function excludePattern (value) {
  return ['(?:', value, ')'].join('')
}

export default parser
