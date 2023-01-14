import { useNavigation } from '@react-navigation/native'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
  Dimensions,
  FlatList
} from 'react-native'
import AppContext from '../contexts/AppContext'
import Assignment from '../components/Assignment'
import {
  addAssignment,
  convertGradebook,
  isNumber,
  calculateMarkColor,
  roundTo
} from '../gradebook/GradeUtil'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Modal from 'react-native-modal'
import DropDownPicker from 'react-native-dropdown-picker'
import { Colors } from '../colors/Colors'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FadeInFlatList } from '@ja-ka/react-native-fade-in-flatlist'
import { AnimatedFAB, Chip, TextInput, useTheme } from 'react-native-paper'
import { Category } from '../interfaces/Gradebook'

const CourseDetails = ({ route }) => {
  const courseName = route.params.title
  const navigation = useNavigation()
  const theme = useTheme()

  const { marks, client, setMarks } = useContext(AppContext)
  const course = marks.courses.get(courseName)

  const [chips, setChips] = useState(
    new Map(JSON.parse(JSON.stringify(Array.from(course.categories)))) as Map<
      String,
      Category
    >
  )

  const refInput = useRef(null)

  const [isModalVisible, setModalVisible] = useState(false)
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState(
    marks.courses.get(courseName).categories.values().next().value?.name
  )
  const [categories, setCategories] = useState(
    Array.from(marks.courses.get(courseName).categories.values()).map((c) => {
      return { label: c.name, value: c.name }
    })
  )
  const [points, setPoints] = useState('')
  const [total, setTotal] = useState('')

  const [refreshing, setRefreshing] = useState(false)

  const [isExtended, setIsExtended] = React.useState(true)

  const onScroll = ({ nativeEvent }) => {
    const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0

    setIsExtended(currentScrollPosition <= 0)
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      setMarks(
        await convertGradebook(
          await client.gradebook(marks.reportingPeriod.index)
        )
      )
    } catch (err) {}
    setRefreshing(false)
  }, [])

  useEffect(() => {
    if (isModalVisible) {
      setPoints('')
      setTotal('')
    }
  }, [isModalVisible])

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

  const toggleModal = (): void => {
    setModalVisible(!isModalVisible)
  }

  const add = () => {
    setMarks(
      addAssignment(
        marks,
        course,
        category,
        parseFloat(points),
        parseFloat(total)
      )
    )
    toggleModal()
  }

  let coursePoints = 0
  let courseTotal = 0
  for (const category of chips.values()) {
    if (!isNaN(category.value)) {
      coursePoints += category.value * category.weight
      courseTotal += category.weight
    }
  }
  const courseValue = roundTo((coursePoints / courseTotal) * 100, 2)

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light_gray }}>
      <SafeAreaView
        style={styles.course_name_container}
        edges={['top', 'left', 'right']}
      >
        <MaterialCommunityIcons.Button
          name="chevron-left"
          backgroundColor="transparent"
          iconStyle={{
            color: theme.colors.primary
          }}
          style={{ padding: 2 }}
          underlayColor="none"
          activeOpacity={0.2}
          size={40}
          onPress={() => navigation.goBack()}
        />
        <Text
          numberOfLines={2}
          style={[styles.course_name, { color: theme.colors.onBackground }]}
        >
          {courseName}
        </Text>
      </SafeAreaView>
      <View
        style={[
          styles.course_mark_container,
          {
            borderColor: calculateMarkColor(courseValue),
            backgroundColor: Colors.white
          }
        ]}
      >
        <Text numberOfLines={1} style={styles.course_mark}>
          {isNaN(courseValue) ? 'N/A' : courseValue}
        </Text>
      </View>
      <View style={{ height: 44 }}>
        <FlatList
          showsHorizontalScrollIndicator={false}
          horizontal
          data={[...course.categories.entries()]}
          renderItem={({ item }) => {
            const selected = chips.has(item[1].name)
            return (
              <Chip
                selected={selected}
                mode={selected ? 'flat' : 'outlined'}
                style={{ marginHorizontal: 8 }}
                onPress={() => {
                  if (!selected) {
                    const newChips = chips
                    newChips.set(item[0], item[1])
                    setChips(
                      new Map(JSON.parse(JSON.stringify(Array.from(newChips))))
                    )
                  } else {
                    const newChips = chips
                    newChips.delete(item[0])
                    setChips(
                      new Map(JSON.parse(JSON.stringify(Array.from(newChips))))
                    )
                  }
                }}
              >
                {item[1].name}
              </Chip>
            )
          }}
          keyExtractor={(item) => item[1].name}
        />
      </View>
      <View
        style={{
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          flex: 1
        }}
      >
        <FadeInFlatList
          onScroll={onScroll}
          initialDelay={0}
          durationPerItem={350}
          parallelItems={5}
          itemsToFadeIn={Dimensions.get('window').height / 75}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: 10
          }}
          data={course.assignments.filter((a) => chips.has(a.category))}
          renderItem={({ item }) => (
            <Assignment
              name={item.name}
              courseName={courseName}
              key={item.name}
            ></Assignment>
          )}
        />
        <AnimatedFAB
          icon={'plus'}
          label={'New Assignment'}
          extended={isExtended}
          onPress={toggleModal}
          animateFrom={'right'}
          iconMode={'dynamic'}
          variant={'primary'}
          style={{
            bottom: 12,
            right: 12,
            position: 'absolute'
          }}
        />
      </View>
      <Modal
        isVisible={isModalVisible}
        coverScreen={false}
        onBackdropPress={toggleModal}
        animationIn={'zoomIn'}
        animationOut={'zoomOut'}
        animationInTiming={150}
        animationOutTiming={150}
        backdropTransitionOutTiming={0}
      >
        <View style={styles.modal}>
          <View style={styles.modal_view}>
            <TextInput
              returnKeyType={'next'}
              value={points}
              keyboardType="decimal-pad"
              autoComplete="off"
              placeholder="Points Earned"
              onChangeText={(t) => {
                if (isNumber(t) || t === '') setPoints(t)
              }}
              style={styles.input}
              textColor={Colors.black}
              placeholderTextColor={Colors.secondary}
              blurOnSubmit={false}
              onSubmitEditing={() => refInput.current.focus()}
            />
            <TextInput
              returnKeyType={'next'}
              value={total}
              keyboardType="decimal-pad"
              autoComplete="off"
              placeholder="Total Points"
              onChangeText={(t) => {
                if (isNumber(t) || t === '') setTotal(t)
              }}
              style={styles.input}
              textColor={Colors.black}
              placeholderTextColor={Colors.secondary}
              ref={refInput}
              onSubmitEditing={() => setOpen(true)}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginHorizontal: 10
              }}
            >
              <DropDownPicker
                open={open}
                value={category}
                items={categories}
                setOpen={setOpen}
                setValue={setCategory}
                setItems={setCategories}
                maxHeight={null}
                style={styles.dropdown}
                textStyle={styles.dropdown_text}
                containerStyle={styles.dropdown_container}
                translation={{
                  PLACEHOLDER: 'Select Category'
                }}
                renderListItem={(props) => {
                  return (
                    <TouchableOpacity
                      {...props}
                      style={[
                        props.listItemContainerStyle,
                        {
                          backgroundColor: props.isSelected && Colors.light_gray
                        }
                      ]}
                      onPress={() => {
                        setCategory(props.value)
                        setOpen(false)
                      }}
                      activeOpacity={0.2}
                    >
                      <View style={styles.category_name_container}>
                        <Text
                          numberOfLines={1}
                          style={props.listItemLabelStyle}
                        >
                          {props.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                }}
              ></DropDownPicker>
              <MaterialCommunityIcons.Button
                name="plus-circle"
                backgroundColor="transparent"
                iconStyle={{
                  color: Colors.navy
                }}
                style={{ padding: 0, margin: 0, marginRight: -8 }}
                size={50}
                underlayColor="none"
                activeOpacity={0.2}
                onPress={add}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const getTotalGrade = (c, categories) => {
  const course = Object.assign({}, c)
  ;(course.points = 0), (course.total = 0), (course.value = NaN)
  for (const category of categories.values()) {
    ;(category.points = 0), (category.total = 0), (category.value = NaN)
  }
  for (const assignment of course.assignments) {
    const category = categories.get(assignment.category)
    if (category && !isNaN(assignment.points) && !isNaN(assignment.total)) {
      category.points += assignment.points
      category.total += assignment.total
      category.value = category.points / category.total
    }
  }
  for (const category of categories.values()) {
    if (!isNaN(category.value)) {
      course.points += category.value * category.weight
      course.total += category.weight
    }
  }
  return roundTo((course.points / course.total) * 100, 2)
}

const styles = StyleSheet.create({
  input: {
    marginHorizontal: 10,
    marginBottom: 10,
    paddingHorizontal: 5,
    borderWidth: 1,
    height: 36,
    backgroundColor: 'transparent',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    borderRadius: 4
  },
  modal: {
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: 320,
    padding: 16
  },
  modal_view: {
    width: 320
  },
  course_name: {
    fontSize: 24,
    flex: 1,
    flexWrap: 'wrap',
    fontFamily: 'Inter_800ExtraBold',
    marginRight: 4
  },
  course_name_container: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.black,
    backgroundColor: 'transparent',
    alignSelf: 'center'
  },
  dropdown_text: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12
  },
  dropdown_container: {
    width: 240,
    alignSelf: 'center'
  },
  category_name_container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  course_mark_container: {
    margin: 10,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 28,
    borderWidth: 3
  },
  course_mark: {
    textAlignVertical: 'center',
    fontFamily: 'Montserrat_800ExtraBold',
    fontSize: 50
  }
})

export default CourseDetails
