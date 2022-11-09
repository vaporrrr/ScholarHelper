import React, { useContext, useState, useEffect } from 'react'
import AppContext from '../contexts/AppContext'
import {
  StyleSheet,
  View,
  Text,
  Platform,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  BackHandler
} from 'react-native'
import Course from '../components/Course'
import DropDownPicker from 'react-native-dropdown-picker'
import { convertGradebook, parseCourseName } from '../gradebook/GradeUtil'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { Colors } from '../colors/Colors'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NavigationActions } from 'react-navigation'

const Courses = ({ navigation, route }) => {
  const { client, marks, setMarks } = useContext(AppContext)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(marks.reportingPeriod.index)
  const [periods, setPeriods] = useState(
    marks.reportingPeriods.map((p) => {
      return { label: p.name, value: p.index }
    })
  )

  useEffect(() => {
    onRefresh()
  }, [value])

  useEffect(() => {
    const backAction = () => {
      navigation.goBack()
      return true
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    )

    return () => backHandler.remove()
  }, [])

  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      setMarks(await convertGradebook(await client.gradebook(value)))
    } catch (err) {}
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <DropDownPicker
        open={open}
        value={value}
        items={periods}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setPeriods}
        maxHeight={null}
        style={styles.dropdown}
        labelProps={{ numberOfLines: 1 }}
        textStyle={[styles.dropdown_text, { fontSize: 50 }]}
        translation={{
          PLACEHOLDER: 'Select Marking Period'
        }}
        renderListItem={(props) => {
          return (
            <TouchableOpacity
              {...props}
              style={[
                {
                  backgroundColor: props.isSelected && Colors.light_gray
                }
              ]}
              onPress={() => {
                setValue(props.value)
                setOpen(false)
              }}
              activeOpacity={0.5}
            >
              <View style={styles.marking_period_container}>
                <Text
                  numberOfLines={1}
                  style={[styles.dropdown_text, { fontSize: 25 }]}
                >
                  {props.label}
                </Text>
              </View>
            </TouchableOpacity>
          )
        }}
      ></DropDownPicker>
      <View style={styles.row_container}>
        {!isNaN(marks.gpa) && (
          <View style={styles.gpa_container}>
            <Text style={styles.gpa}>{marks.gpa} GPA</Text>
          </View>
        )}
        {Platform.OS === 'web' && (
          <View style={styles.refresh_button_container}>
            <FontAwesome.Button
              name="refresh"
              backgroundColor="transparent"
              iconStyle={{
                color: Colors.secondary
              }}
              underlayColor="none"
              activeOpacity={0.5}
              size={24}
              onPress={onRefresh}
            ></FontAwesome.Button>
          </View>
        )}
      </View>
      {marks && (
        <View style={{ height: '100%' }}>
          <FlatList
            data={[...marks.courses.entries()]}
            renderItem={({ item }) => (
              <Course
                name={parseCourseName(item[0])}
                mark={item[1].value}
                period={item[1].period}
                teacher={item[1].teacher}
                onPress={() => {
                  navigation.navigate('Course Details', { title: item[0] })
                }}
              ></Course>
            )}
            keyExtractor={(item) => item[0]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 7,
              ...Platform.select({
                web: {
                  paddingBottom: 60
                },
                default: {
                  paddingBottom: 10
                }
              })
            }}
          />
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  // android status bar not accounted for properly in safeview + dropdownpicker
  // web needs to be shifted 11 right
  dropdown: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center'
  },
  dropdown_text: {
    fontFamily: 'Inter_800ExtraBold'
  },
  marking_period_container: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 11
  },
  row_container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  gpa_container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  gpa: {
    marginLeft: 11,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 25
  },
  refresh_button_container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  }
})

export default Courses
