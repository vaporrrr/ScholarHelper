import React, { useContext, useEffect, useRef, useState } from 'react'
import { StyleSheet, View, Animated, Easing } from 'react-native'
import AppContext from '../contexts/AppContext'
import { Agenda, AgendaSchedule } from 'react-native-calendars'
import useAsyncEffect from 'use-async-effect'
import Item from '../components/Item'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from 'react-native-paper'
import { palette } from '../theme/colors'
import { Colors } from '../colors/Colors'

const CalendarScreen = () => {
  const { client } = useContext(AppContext)
  const [items, setItems] = useState(null as AgendaSchedule)
  const theme = useTheme()
  const [key, setKey] = useState(0)

  useEffect(() => {
    setKey(Math.random())
  }, [theme])

  const lowestScale = 0.4
  const scaleAnim = useRef(new Animated.Value(lowestScale)).current

  useAsyncEffect(async () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.elastic(1),
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: lowestScale,
          duration: 750,
          easing: Easing.back(1),
          useNativeDriver: true
        })
      ])
    ).start()

    try {
      const calendar = await client.calendar()
      const start = new Date(calendar.outputRange.start)
      const end = new Date(calendar.outputRange.end)

      const currentItems = {}
      for (const date of getDatesFromDateRange(start, end)) {
        currentItems[toCalendarTimeString(date)] = []
      }

      for (const event of calendar.events) {
        const dateString = toCalendarTimeString(event.date)
        if (currentItems[dateString])
          currentItems[dateString].push({
            event: event,
            day: dateString
          })
      }
      const newItems = {}
      Object.keys(currentItems).forEach((key) => {
        newItems[key] = currentItems[key]
      })
      setItems(newItems)
    } catch (err) {}
  }, [])

  return (
    <View style={{ flex: 1 }}>
      {items ? (
        <Agenda
          key={key}
          items={items}
          renderItem={(item) => renderItem(item)}
          minDate={Object.keys(items)[0]}
          maxDate={Object.keys(items)[Object.keys(items).length - 1]}
          removeClippedSubviews
          theme={{
            calendarBackground: theme.dark
              ? palette.neutralVariant10
              : theme.colors.elevation.level1,
            monthTextColor: theme.colors.onSurfaceVariant,
            dotColor: Colors.accent,
            dayTextColor: theme.dark ? Colors.white : Colors.black,
            agendaDayTextColor: theme.colors.onSurfaceVariant,
            agendaDayNumColor: theme.colors.onSurface,
            textDisabledColor: Colors.secondary,
            agendaTodayColor: theme.colors.tertiary,
            agendaKnobColor: theme.dark ? 'white' : 'black',
            selectedDayBackgroundColor: theme.colors.primary,
            selectedDayTextColor: theme.colors.onPrimary,
            todayBackgroundColor: theme.colors.tertiary,
            todayTextColor: theme.colors.onTertiary,
            //@ts-ignore
            'stylesheet.agenda.main': {
              reservations: {
                backgroundColor: theme.colors.surface,
                flex: 1,
                marginTop: 100
              }
            }
          }}
        />
      ) : (
        <Animated.View style={[styles.scale_container, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View style={[styles.fadingContainer]}>
            <MaterialCommunityIcons name="calendar" size={50} color={theme.colors.onSurface} />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  )
}

const getDatesFromDateRange = (from: Date, to: Date): Date[] => {
  const dates = []
  for (let date = from; date < to; date.setDate(date.getDate() + 1)) {
    const cloned = new Date(date.valueOf())
    dates.push(cloned)
  }
  dates.push(to)
  return dates
}

const renderItem = (item) => {
  return <Item item={item}></Item>
}

const toCalendarTimeString = (date: Date) => {
  return date.toISOString().split('T')[0]
}

const styles = StyleSheet.create({
  scale_container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  fadingContainer: {
    position: 'absolute'
  }
})

export default CalendarScreen
