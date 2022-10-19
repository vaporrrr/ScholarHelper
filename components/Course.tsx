import React from 'react'
import { StyleSheet, View, Text, Platform } from 'react-native'
import { Colors } from '../colors/Colors'
import {
  calculateLetterGrade,
  calculateMarkColor
} from '../gradebook/GradeUtil'

function Course(props) {
  const mark: number = parseFloat(props.mark)

  return (
    <View style={[styles.container, props.style]}>
      <Text style={styles.period_number}>{('0' + props.period).slice(-2)}</Text>
      <View style={styles.course_info_container}>
        <Text
          numberOfLines={1}
          style={Platform.OS === 'web' ? styles.name_web : styles.name}
        >
          {props.name}
        </Text>
        <Text
          numberOfLines={1}
          style={Platform.OS === 'web' ? styles.teacher_web : styles.teacher}
        >
          {props.teacher}
        </Text>
      </View>
      <Text style={[styles.mark]}>
        {isNaN(parseFloat(props.mark)) ? 'N/A' : props.mark}
      </Text>
      {!isNaN(parseFloat(props.mark)) && (
        <Text
          style={[
            styles.letter_grade,
            {
              color: calculateMarkColor(mark)
            }
          ]}
        >
          {calculateLetterGrade(mark)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.off_white,
    borderRadius: 15,
    height: 55,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 7,
    marginTop: 10,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.secondary
  },
  period_number: {
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 32
  },
  course_info_container: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginHorizontal: 7,
    flex: 1
  },
  name_web: {
    color: Colors.navy,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    marginRight: 14,
    marginLeft: 7,
    lineHeight: 18 * 0.75,
    textAlign: 'left',
    paddingBottom: 12 - 12 * 0.75
  },
  teacher_web: {
    color: Colors.black,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginRight: 14,
    marginLeft: 7,
    lineHeight: 12 * 0.75 + 2,
    paddingBottom: 2,
    marginTop: 4,
    textAlign: 'left'
  },
  name: {
    color: Colors.navy,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    marginRight: 14,
    marginLeft: 7,
    lineHeight: 18 * 0.75,
    paddingTop: 18 - 18 * 0.75,
    textAlign: 'left'
  },
  teacher: {
    color: Colors.black,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginRight: 14,
    marginLeft: 7,
    lineHeight: 12 * 0.75,
    paddingTop: 12 - 12 * 0.75,
    marginTop: 4,
    textAlign: 'left'
  },
  mark: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 28,
    alignSelf: 'center'
  },
  letter_grade: {
    marginLeft: 7,
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 32,
    alignSelf: 'center'
  }
})

export default Course
