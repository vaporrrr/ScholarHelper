import { Gradebook } from 'studentvue'
import { Colors } from '../colors/Colors'
import { Assignment, Category, Course, Marks } from '../interfaces/Gradebook'
import { Dimensions, Platform, PixelRatio } from 'react-native'
import { round } from '../util/Util'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const scale = SCREEN_WIDTH / 320

const normalize = (size: number): number => {
  const newSize = size * scale
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize))
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2
  }
}

// Some course names have the course ID at the end, ex: AP History A (SOC49351)
const parseCourseName = (name: string): string => {
  return name.substring(0, name.lastIndexOf('(')).trim()
}

const convertGradebook = (gradebook: Gradebook) => {
  let marks: Marks = {
    gpa: 0,
    courses: new Map<string, Course>(),
    reportingPeriod: gradebook.reportingPeriod.current,
    reportingPeriods: gradebook.reportingPeriod.available
  }
  for (const course of gradebook.courses) {
    marks.courses.set(course.title, {
      name: course.title,
      period: gradebook.courses.findIndex((c) => c.title === course.title) + 1,
      teacher: course.staff.name,
      points: 0,
      total: 0,
      value: NaN,
      assignments: [],
      categories: new Map<string, Category>(),
      room: course.room
    })
    const c = marks.courses.get(course.title)
    if (course.marks.length > 0) {
      for (const category of course.marks[0].weightedCategories) {
        if (category.type.toUpperCase() !== 'TOTAL') {
          c.categories.set(category.type, {
            name: category.type,
            points: 0,
            total: 0,
            value: NaN,
            weight: parseFloat(category.weight.standard),
            show: true
          })
        }
      }
      for (const assignment of course.marks[0].assignments) {
        const value = assignment.score.value
        const points = parsePoints(assignment.points)
        const a: Assignment = {
          name: assignment.name,
          category: assignment.type,
          status:
            value != 'Not Graded' && value != 'Not Due' ? 'Graded' : value,
          notes: assignment.notes,
          points: points[0],
          total: points[1],
          modified: false,
          date: {
            due: assignment.date.due,
            start: assignment.date.start
          }
        }
        c.assignments.push(a)
      }
    }
  }
  return calculatePoints(marks)
}

const calculatePoints = (marks: Marks): Marks => {
  marks.gpa = 0
  let numOfCourses = 0
  for (const course of marks.courses.values()) {
    ;(course.points = 0), (course.total = 0), (course.value = NaN)
    for (const category of course.categories.values()) {
      ;(category.points = 0), (category.total = 0), (category.value = NaN)
    }
    for (const assignment of course.assignments) {
      const category = course.categories.get(assignment.category)
      if (category && !isNaN(assignment.points) && !isNaN(assignment.total)) {
        category.points += assignment.points
        category.total += assignment.total
        category.value = (category.points / category.total) * 100
      }
    }
    for (const category of course.categories.values()) {
      if (!isNaN(category.value) && category.show) {
        course.points += (category.value / 100) * category.weight
        course.total += category.weight
      }
    }
    course.value = (course.points / course.total) * 100
    if (!isNaN(course.value)) {
      if (course.value >= 89.5) {
        marks.gpa += 4
      } else if (course.value >= 79.5) {
        marks.gpa += 3
      } else if (course.value >= 69.5) {
        marks.gpa += 2
      } else if (course.value >= 59.5) {
        marks.gpa += 1
      }
      numOfCourses++
    }
  }
  marks.gpa = round(marks.gpa / numOfCourses, 2)
  return marks
}

const parsePoints = (points: string): number[] => {
  const regex = /^(\d+\.?\d*|\.\d+) \/ (\d+\.?\d*|\.\d+)$/
  if (points.match(regex)) {
    const p = points.split(regex)
    return [parseFloat(p[1]), parseFloat(p[2])]
  } else {
    return [NaN, parseFloat(points)]
  }
}

const deleteAssignment = (
  marks: Marks,
  course: string,
  assignment: string
): Marks => {
  const newMarks = Object.assign({}, marks)
  newMarks.courses.get(course).assignments = newMarks.courses
    .get(course)
    .assignments.filter((a) => a.name !== assignment)
  return calculatePoints(newMarks)
}

const updatePoints = (
  marks: Marks,
  course: string,
  assignmentName: string,
  points: number,
  type: string
): Marks => {
  const newMarks = Object.assign({}, marks)
  const assignment = newMarks.courses
    .get(course)
    .assignments.find((a) => a.name === assignmentName)
  if (type === 'earned') {
    assignment.points = points
  } else if (type === 'total') {
    assignment.total = points
  }
  assignment.modified = true
  return calculatePoints(newMarks)
}

const addAssignment = (
  marks: Marks,
  course: Course,
  category: string,
  points: number,
  total: number
): Marks => {
  let name = 'Assignment'
  if (course.assignments.some((a) => a.name === name)) {
    let indentifier = 2
    while (course.assignments.some((a) => a.name === name + indentifier)) {
      indentifier++
    }
    name = name + indentifier
  }
  course.assignments.unshift({
    name: name,
    category: category,
    status: 'Graded',
    notes: '',
    points: points,
    total: total,
    modified: true,
    date: {
      due: new Date(),
      start: new Date()
    }
  })
  marks.courses.set(course.name, course)
  const m = Object.assign({}, marks)
  return calculatePoints(m)
}

const calculateMarkColor = (mark: number): string => {
  switch (calculateLetterGrade(mark)) {
    case 'A':
      return '#378137'
    case 'B':
      return '#4C59EB'
    case 'C':
      return '#AD6800'
    case 'D':
      return '#CC3E3E'
    case 'E':
      return '#440808'
    case 'F':
      return Colors.black
  }
}

const calculateLetterGrade = (
  mark: number
): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' => {
  if (mark >= 89.5) {
    return 'A'
  } else if (mark >= 79.5) {
    return 'B'
  } else if (mark >= 69.5) {
    return 'C'
  } else if (mark >= 59.5) {
    return 'D'
  } else if (mark >= 49.5) {
    return 'E'
  } else {
    return 'F'
  }
}

const calculateBarColor = (mark: number): string => {
  switch (calculateLetterGrade(mark)) {
    case 'A':
      return '#4eba4e'
    case 'B':
      return '#6f8cf3'
    case 'C':
      return '#AD6800'
    case 'D':
      return '#CC3E3E'
    case 'E':
      return '#440808'
    case 'F':
      return Colors.black
  }
}

const isNumber = (input: string): boolean => {
  return /^[0-9.]+$/g.test(input)
}

const prependZero = (number): string => {
  if (number < 9) return '0' + number
  else return number
}

const formatAMPM = (date: Date): string => {
  let hours = date.getHours()
  let minutes: string | number = date.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'

  hours %= 12
  hours = hours || 12
  minutes = minutes < 10 ? `0${minutes}` : minutes

  const strTime = `${hours}:${minutes} ${ampm}`
  return strTime
}

const toggleCategory = (marks: Marks, course: Course, category: Category) => {
  category.show = !category.show
  course.categories.set(category.name, category)
  marks.courses.set(course.name, course)
  return calculatePoints(Object.assign({}, marks))
}

export {
  parseCourseName,
  convertGradebook,
  calculatePoints,
  parsePoints,
  deleteAssignment,
  updatePoints,
  addAssignment,
  calculateMarkColor,
  calculateLetterGrade,
  isNumber,
  normalize,
  prependZero,
  formatAMPM,
  toggleCategory,
  calculateBarColor
}
