// Admin filtr toza funksiyalari uchun unit testlar (Req 11.1, 11.2).
import { describe, expect, it } from 'vitest'

import type { Course } from '@/shared/types'

import { distinct, filterCourses, filterUsers } from './filters'
import {
  ALL_FILTER,
  EMPTY_COURSE_FILTERS,
  EMPTY_USER_FILTERS,
  type AdminUser,
} from '../types'

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'u1',
    fullName: 'Test User',
    role: 'STUDENT',
    otmId: 'otm-1',
    otmName: 'OTM 1',
    facultyId: 'fac-1',
    facultyName: 'Faculty 1',
    email: null,
    status: 'ACTIVE',
    ...overrides,
  }
}

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'c1',
    title: 'Course 1',
    teacherId: 't1',
    teacherName: 'Alice',
    direction: 'BACHELOR',
    semester: 1,
    capacity: 100,
    enrolledCount: 10,
    progressPercent: 0,
    ...overrides,
  }
}

describe('filterUsers', () => {
  const users: AdminUser[] = [
    makeUser({ id: 'a', role: 'TEACHER', otmId: 'otm-1', facultyId: 'fac-1', status: 'ACTIVE' }),
    makeUser({ id: 'b', role: 'STUDENT', otmId: 'otm-2', facultyId: 'fac-2', status: 'INACTIVE' }),
    makeUser({ id: 'c', role: 'STUDENT', otmId: 'otm-1', facultyId: 'fac-1', status: 'SUSPENDED' }),
  ]

  it('returns the full list when no filter is set', () => {
    expect(filterUsers(users, EMPTY_USER_FILTERS)).toEqual(users)
  })

  it('filters by role', () => {
    const result = filterUsers(users, { ...EMPTY_USER_FILTERS, role: 'STUDENT' })
    expect(result.map((u) => u.id)).toEqual(['b', 'c'])
  })

  it('filters by OTM', () => {
    const result = filterUsers(users, { ...EMPTY_USER_FILTERS, otmId: 'otm-1' })
    expect(result.map((u) => u.id)).toEqual(['a', 'c'])
  })

  it('filters by faculty', () => {
    const result = filterUsers(users, {
      ...EMPTY_USER_FILTERS,
      facultyId: 'fac-2',
    })
    expect(result.map((u) => u.id)).toEqual(['b'])
  })

  it('filters by status', () => {
    const result = filterUsers(users, {
      ...EMPTY_USER_FILTERS,
      status: 'SUSPENDED',
    })
    expect(result.map((u) => u.id)).toEqual(['c'])
  })

  it('combines multiple filters with AND', () => {
    const result = filterUsers(users, {
      role: 'STUDENT',
      otmId: 'otm-1',
      facultyId: 'fac-1',
      status: ALL_FILTER,
    })
    expect(result.map((u) => u.id)).toEqual(['c'])
  })

  it('does not mutate the input array', () => {
    const copy = [...users]
    filterUsers(users, { ...EMPTY_USER_FILTERS, role: 'TEACHER' })
    expect(users).toEqual(copy)
  })
})

describe('filterCourses', () => {
  const courses: Course[] = [
    makeCourse({ id: 'a', direction: 'BACHELOR', semester: 1, teacherId: 't1', teacherName: 'Alice' }),
    makeCourse({ id: 'b', direction: 'MASTER', semester: 2, teacherId: 't2', teacherName: 'Bob' }),
    makeCourse({ id: 'c', direction: 'BACHELOR', semester: 2, teacherId: 't1', teacherName: 'Alice' }),
  ]

  it('returns the full list when no filter is set', () => {
    expect(filterCourses(courses, EMPTY_COURSE_FILTERS)).toEqual(courses)
  })

  it('filters by direction', () => {
    const result = filterCourses(courses, {
      ...EMPTY_COURSE_FILTERS,
      direction: 'MASTER',
    })
    expect(result.map((c) => c.id)).toEqual(['b'])
  })

  it('filters by semester', () => {
    const result = filterCourses(courses, {
      ...EMPTY_COURSE_FILTERS,
      semester: '2',
    })
    expect(result.map((c) => c.id)).toEqual(['b', 'c'])
  })

  it('filters by teacher', () => {
    const result = filterCourses(courses, {
      ...EMPTY_COURSE_FILTERS,
      teacherId: 't1',
    })
    expect(result.map((c) => c.id)).toEqual(['a', 'c'])
  })

  it('combines direction + semester + teacher with AND', () => {
    const result = filterCourses(courses, {
      direction: 'BACHELOR',
      semester: '2',
      teacherId: 't1',
    })
    expect(result.map((c) => c.id)).toEqual(['c'])
  })
})

describe('distinct', () => {
  it('removes duplicates while preserving order', () => {
    expect(distinct(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c'])
  })

  it('skips null, undefined and empty string values', () => {
    expect(distinct(['a', null, '', undefined, 'b'])).toEqual(['a', 'b'])
  })

  it('works with numbers', () => {
    expect(distinct([1, 2, 2, 3, 1])).toEqual([1, 2, 3])
  })
})
