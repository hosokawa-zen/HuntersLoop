import React, { useState, useEffect, useRef } from 'react';

import {
    StyleSheet,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    Platform,
    Text,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Linking
} from 'react-native';
import normalize from 'react-native-normalize';
import { RFPercentage } from 'react-native-responsive-fontsize';

import EntypoIcon from 'react-native-vector-icons/Entypo';
EntypoIcon.loadFont();
import Spinner from 'react-native-loading-spinner-overlay';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';

import { Colors, Constants } from '@constants';

import { setData, uploadMedia } from '../../service/firebase';
import ImagePicker from "react-native-image-crop-picker";
import DatePicker from "../../components/DatePicker";

export default function BusinessProfileEdit({ navigation, route }) {
    const [business, setBusiness] = useState();
    const [refresh, setRefresh] = useState(false);
    const [spinner, setSpinner] = useState(false);
    const [fromTime, setFromTime] = useState(new Date());
    const [toTime, setToTime] = useState(new Date());

    const [logoImagePath, setLogoImagePath] = useState();
    const [iconImagePath, setIconImagePath] = useState();
    const [imagesPath, setImagesPath] = useState([]);


    useEffect(() => {
        if (Constants.user && Constants.user.role == 'business') {
            const myBusiness = {...Constants.business.find(one => one.id == Constants.user.bid)};
            setBusiness(myBusiness);

            if (myBusiness.operatingHours.from) {
                const from = myBusiness.operatingHours.from;
                var hours = from.split(':')[0] * 1;
                if (from.toLowerCase().includes('pm')) {
                    hours += 12;
                }
                fromTime.setHours(hours);
                var mins = parseInt(from.split(':')[1]);
                fromTime.setMinutes(mins);
                setFromTime(fromTime);
            }
            if (myBusiness.operatingHours.to) {
                const to = myBusiness.operatingHours.to;
                var hours = to.split(':')[0] * 1;
                if (to.toLowerCase().includes('pm')) {
                    hours += 12;
                }
                toTime.setHours(hours);
                const mins = parseInt(to.split(':')[1]);
                toTime.setMinutes(mins);
                setToTime(toTime);
            }
        }
    }, [])

    if (!business) return null;


    const updateBusiness = (key, value) => {
        business[key] = value;
        setBusiness(business);
        setRefresh(!refresh);
    }

    const onUpdateImage = (index) => {
        Alert.alert(
            'Select Image',
            '',
            [
                {
                    text: "Cancel", onPress: () => {
                    }
                },
                {
                    text: "Take photo", onPress: async () => {
                        await takePhoto(index);
                    }
                },
                {
                    text: "From library", onPress: async () => {
                        await pickImage(index);
                    }
                },
            ]);
    };

    const checkCameraPermission = () => {
        return new Promise((resolve, reject) => {
            check(Platform.OS === 'ios'?PERMISSIONS.IOS.CAMERA:PERMISSIONS.ANDROID.CAMERA)
                .then((result) => {
                    if (result == RESULTS.GRANTED) resolve(true);
                    else resolve(false);
                })
                .catch((error) => {
                    resolve(false);
                })
        })
    }

    const checkPhotosPermission = () => {
        return new Promise((resolve, reject) => {
            check(Platform.OS === 'ios'?PERMISSIONS.IOS.PHOTO_LIBRARY:PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE)
                .then((result) => {
                    if (result == RESULTS.GRANTED) resolve(true);
                    else resolve(false);
                })
                .catch((error) => {
                    resolve(false);
                })
        })
    }

    const takePhoto = async (index = null) => {
        let isCameraPermission = await checkCameraPermission();
        if (!isCameraPermission) {
            Alert.alert(
                'Visit settings and allow camera permission',
                '',
                [
                    {
                        text: "OK", onPress: () => {
                            Linking.openURL('app-settings:');
                        }
                    },
                    {
                        text: "CANCEL", onPress: () => {
                        }
                    }
                ]);
            return;
        }

        let options = {
            cropping: false,
            compressImageQuality: 0.8,
            enableRotationGesture: true,
            avoidEmptySpaceAroundImage: false,
        };
        try{
            const response = await ImagePicker.openCamera(options);
            if (index === 'logo') {
                business.img = response.path;
                setLogoImagePath(response.path);
            } else if (index === 'icon'){
                business.icon = response.path;
                setIconImagePath(response.path);
            } else {
                business.slideImgs[index] = response.path
                imagesPath[index] = response.path
                setImagesPath(imagesPath);
            }
            setBusiness(business)
            setRefresh(!refresh)
        } catch (e) {
            console.log('pick error', e)
        }
    }

    const pickImage = async (index = null) => {
        let isCameraPermission = await checkPhotosPermission();
        if (!isCameraPermission) {
            Alert.alert(
                'Visit settings and allow photos permission',
                '',
                [
                    {
                        text: "OK", onPress: () => {
                            Linking.openURL('app-settings:');
                        }
                    },
                    {
                        text: "CANCEL", onPress: () => {
                        }
                    }
                ]);
            return;
        }
        let options = {
            cropping: false,
            compressImageQuality: 0.8,
            enableRotationGesture: true,
            avoidEmptySpaceAroundImage: false,
            mediaType: 'photo'
        };
        try{
            const response = await ImagePicker.openPicker(options);
            if (index === 'logo') {
                business.img = response.path;
                setLogoImagePath(response.path);
            } else if (index === 'icon'){
                business.icon = response.path;
                setIconImagePath(response.path);
            } else {
                business.slideImgs[index] = response.path
                imagesPath[index] = response.path
                setImagesPath(imagesPath);
            }
            setBusiness(business)
            setRefresh(!refresh)
        } catch (e) {
            console.log('pick error', e)
        }
    };

    const uploadPhoto = (localPath, fbPath) => {
        console.log({localPath, fbPath})
        return new Promise(async (resolve, reject) => {
            var platformPhotoLocalPath = Platform.OS === "android" ? localPath : localPath.replace("file://", "")
            // let newPath = '';
            // await ImageResizer.createResizedImage(platformPhotoLocalPath, 400, 200, 'PNG', 50, 0, null)
            //     .then(response => {
            //         newPath = response.uri;
            //         console.log({newPath})
            //     })
            //     .catch(err => {
            //         console.log('image resizer error', err);
            //     });
                console.log(platformPhotoLocalPath);

            await uploadMedia('business', fbPath, platformPhotoLocalPath)
                .then((downloadURL) => {
                    if (!downloadURL) return;
                    // console.log('downloadURL', downloadURL)
                    // setImgDownloadUrl(downloadURL);
                    resolve(downloadURL);
                })
                .catch((err) => {
                    console.log('upload photo error', err);
                    reject(err);
                })
        })
    }

    const onSave = async () => {
        if(fromTime > toTime){
            return Alert.alert('', 'Please select valid Operation Hours');
        }
        setSpinner(true);
        if (business.img && business.img.substring(0,4) != 'http' && logoImagePath) {
            business.img = await uploadPhoto(logoImagePath, business.id + '/main');
        }

        if (business.icon && business.icon.substring(0,4) != 'http' && iconImagePath) {
            business.icon = await uploadPhoto(iconImagePath, business.id + '/icon');
        }

        const slideImgs = [];
        for (let index = 0; index < business.slideImgs.length; index++) {
            const image_uri = business.slideImgs[index];
            if (image_uri) {
                if (image_uri.substring(0,4) == 'http') {
                    slideImgs.push(image_uri)
                } else if (imagesPath[index]) {
                    slideImgs.push(await uploadPhoto(imagesPath[index], business.id + '/detail_' + slideImgs.length) )
                }
            }
        }

        business.slideImgs = slideImgs
        try {
            setData('business', 'update', business).then(res => {
                const index = Constants.business.findIndex(each => each.id == business.id);
                Constants.business.splice(index, 1, business);
                Alert.alert('', 'update business successfully.',[{ text: "OK", onPress: () => setSpinner(false) }]);

                if (route.params.refresh) {
                    route.params.refresh();
                }
            })
        } catch (err) {
            console.warn(err.code, err.message);
            Alert.alert(err.message);
        }
    }


    return (
        <KeyboardAvoidingView style={styles.container}  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Spinner
                visible={spinner}
                textContent={''}
            />
            <View style={styles.header}>
                <View style={styles.iconHomeContainer}>
                    <TouchableOpacity onPress={() => { Constants.refreshFlag = true; navigation.goBack(null) }}>
                        <EntypoIcon name="chevron-thin-left" style={styles.headerIcon}></EntypoIcon>
                    </TouchableOpacity>
                </View>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleTxt} ellipsizeMode={'tail'} numberOfLines={1} >Edit Business Profile</Text>
                </View>
            </View>

            <View style={styles.body}>
                <ScrollView keyboardShouldPersistTaps='always' style={{ paddingHorizontal: 8, flexGrow: 1}}>
                    <Text style={styles.logoTxt}>Company Logo</Text>
                    <View style={styles.logo}>
                        <TouchableOpacity style={styles.logoBtn} onPress={() => onUpdateImage('logo')}>
                            {business.img ?
                                <Image style={styles.logoImg} source={{ uri: business.img }} resizeMode='cover' />
                                :
                                <>
                                    <EntypoIcon name="plus" style={styles.logoTxt}></EntypoIcon>
                                    <Text style={styles.logoTxt}>Update Image</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.logoTxt}>Company Icon</Text>
                    <View style={styles.logo}>
                        <TouchableOpacity style={styles.logoBtn} onPress={() => onUpdateImage('icon')}>
                            {business.icon ?
                                <Image style={styles.logoImg} source={{ uri: business.icon }} resizeMode='cover' />
                                :
                                <>
                                    <EntypoIcon name="plus" style={styles.logoTxt}></EntypoIcon>
                                    <Text style={styles.logoTxt}>Update Image</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.logoTxt}>Slide Images</Text>
                    <View style={styles.logo}>
                        <TouchableOpacity style={styles.logoBtn} onPress={() => onUpdateImage(0)}>
                            {business.slideImgs[0] ?
                                <Image style={styles.logoImg} source={{ uri: business.slideImgs[0] }} resizeMode='cover' />
                                :
                                <>
                                    <EntypoIcon name="plus" style={styles.logoTxt}></EntypoIcon>
                                    <Text style={styles.logoTxt}>Update Image</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </View>
                    <View style={styles.logo}>
                        <TouchableOpacity style={styles.logoBtn} onPress={() => onUpdateImage(1)}>
                            {business.slideImgs[1] ?
                                <Image style={styles.logoImg} source={{ uri: business.slideImgs[1] }} resizeMode='cover' />
                                :
                                <>
                                    <EntypoIcon name="plus" style={styles.logoTxt}></EntypoIcon>
                                    <Text style={styles.logoTxt}>Update Image</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </View>
                    <View style={styles.logo}>
                        <TouchableOpacity style={styles.logoBtn} onPress={() => onUpdateImage(2)}>
                            {business.slideImgs[2] ?
                                <Image style={styles.logoImg} source={{ uri: business.slideImgs[2] }} resizeMode='cover' />
                                :
                                <>
                                    <EntypoIcon name="plus" style={styles.logoTxt}></EntypoIcon>
                                    <Text style={styles.logoTxt}>Update Image</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.logoTxt}>Address</Text>
                    <TextInput
                        style={styles.inputBox}
                        autoCapitalize='none'
                        // placeholder={'Address'}
                        placeholderTextColor={Colors.greyColor}
                        // keyboardType='decimal-pad'
                        value={business.address}
                        onChangeText={(text) => updateBusiness('address', text)}
                    ></TextInput>

                    <Text style={styles.logoTxt}>Email</Text>
                    <TextInput
                        style={styles.inputBox}
                        autoCapitalize='none'
                        // placeholder={'Address'}
                        placeholderTextColor={Colors.greyColor}
                        // keyboardType='decimal-pad'
                        value={business.email}
                        onChangeText={(text) => updateBusiness('email', text)}
                    ></TextInput>

                    <Text style={styles.logoTxt}>Website</Text>
                    <TextInput
                        style={styles.inputBox}
                        autoCapitalize='none'
                        // placeholder={'Address'}
                        placeholderTextColor={Colors.greyColor}
                        // keyboardType='decimal-pad'
                        value={business.site}
                        onChangeText={(text) => updateBusiness('site', text)}
                    ></TextInput>

                    <Text style={styles.logoTxt}>Phone number</Text>
                    <TextInput
                        style={styles.inputBox}
                        autoCapitalize='none'
                        // placeholder={'Address'}
                        placeholderTextColor={Colors.greyColor}
                        // keyboardType='decimal-pad'
                        value={business.phone}
                        onChangeText={(text) => updateBusiness('phone', text)}
                    ></TextInput>

                    <Text style={styles.logoTxt}>Operating Hours</Text>
                    <View style={{flexDirection:'row', alignItems: 'center'}}>
                        <DatePicker
                            style={{flex: 1}}
                            placeholder={'Select Time'}
                            type={'time'}
                            value={fromTime}
                            action={({value}) => {
                                if(!value){
                                    return;
                                }
                                if (!business.operatingHours) { business.operatingHours = {} }
                                business.operatingHours.from = getTimeString(value);
                                setFromTime(value)
                            }}
                        />
                        <Text style={{width:60, textAlign: 'center', color: 'black'}}>~</Text>
                        <DatePicker
                            style={{flex: 1}}
                            placeholder={'Select Time'}
                            type={'time'}
                            value={toTime}
                            action={({value}) => {
                                if(!value){
                                    return;
                                }
                                if (!business.operatingHours) { business.operatingHours = {} }
                                business.operatingHours.to = getTimeString(value);
                                setToTime(value)
                            }}
                        />
                    </View>

                    <Text style={styles.logoTxt}>Information</Text>
                    <TextInput
                        style={[styles.inputBox, {alignItems:'flex-start', height:90, marginBottom: 12}]}
                        autoCapitalize='none'
                        placeholder={'About the hunt'}
                        placeholderTextColor={Colors.greyColor}
                        multiline={true}
                        value={business.desc}
                        onChangeText={(text) => updateBusiness('desc', text)}
                    ></TextInput>
                </ScrollView>
                <View style={styles.btnContainer}>
                    <TouchableOpacity style={styles.btn} onPress={() => onSave()}>
                        <Text style={styles.btnTxt}>SAVE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

function getTimeString(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

const styles = StyleSheet.create({
    container: {
        width: width,
        height: height,
        backgroundColor: Colors.greyWeakColor,
        flex: 1
    },
    header: {
        width: '100%',
        height: normalize(70, 'height'),
        flexDirection: 'row',
        backgroundColor: Colors.blackColor
    },
    iconHomeContainer: {
        width: '20%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    titleContainer: {
        width: '60%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconEditContainer: {
        width: '20%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerIcon: {
        fontSize: RFPercentage(3.5),
        color: Colors.whiteColor,
    },
    titleTxt: {
        fontSize: RFPercentage(3.5),
        fontWeight: '600',
        color: Colors.yellowToneColor,
    },

    body: {
        backgroundColor: Colors.whiteColor,
        flexGrow: 1,
        flex: 1
    },
    imgContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: normalize(10, 'height')
    },
    img: {
        width: normalize(150),
        height: normalize(150),
        borderRadius: normalize(75),
        borderWidth: normalize(2),
        borderColor: Colors.greyWeakColor
    },
    imgEditIconBack: {
        width: normalize(25),
        height: normalize(25),
        marginTop: Platform.OS === 'android' ? normalize(120, 'height') : normalize(90, 'height'),
        marginLeft: normalize(-30),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.yellowToneColor,
        borderRadius: normalize(15)
    },
    imgEditIcon: {
        width: '60%',
        height: '60%',
    },

    logo: {
        width: width * 0.9,
        height: normalize(width * 0.9 / 2.4, 'height'),
        backgroundColor: Colors.greyWeakColor,
        marginTop: normalize(10, 'height'),
        borderRadius: normalize(8),
        alignSelf: 'center'
    },
    logoImg: {
        width: '100%',
        height: '100%',
        borderRadius: normalize(8)
    },
    logoBtn: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoTxt: {
        fontSize: RFPercentage(2.5),
        color: 'black',
        marginTop: 10,
    },


    inputContainer: {
        width: '90%',
        flexDirection: 'row',
        alignSelf: 'center',
        // borderWidth: 1
    },
    labelTxt: {
        width: '25%',
        textAlign: 'right',
        fontSize: RFPercentage(2.2),
        fontWeight: '600',
        color: Colors.blackColor,
        marginTop: normalize(19, 'height'),
        marginRight: normalize(10)
    },
    inputBox: {
        width: '100%',
        height: normalize(45, 'height'),
        backgroundColor: Colors.greyWeakColor,
        fontSize: RFPercentage(2.5),
        borderRadius: normalize(8),
        marginTop: normalize(5, 'height'),
        paddingLeft: normalize(10),
    },

    favoritesHeader: {
        width: '100%',
        height: '8%',
        backgroundColor: Colors.yellowToneColor,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: normalize(10, 'height'),
        marginBottom: normalize(10, 'height'),
    },
    favoritesHeaderTxt: {
        fontSize: RFPercentage(3),
        fontWeight: '600',
        color: Colors.blackColor
    },

    emptyContainer: {
        width: '100%',
        height: normalize(200, 'height'),
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTxt: {
        fontSize: RFPercentage(2.2),
        fontWeight: '600',
        color: Colors.whiteColor
    },
    btnContainer: {
        width: '100%',
        height: normalize(64, 'height'),
        backgroundColor: Colors.greyStrongColor,
        justifyContent: 'center',
        alignItems: 'center'
    },
    btn: {
        width: '80%',
        height: normalize(45, 'height'),
        backgroundColor: Colors.yellowToneColor,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: normalize(8),
    },
    btnTxt: {
        fontSize: RFPercentage(2.5),
        color: Colors.blackColor
    },
});
