import React from 'react';
import messaging from "@react-native-firebase/messaging";

import Navigator from './src/Navigator';
import InAppNotification, {INAPP_NOTIFICATION_EMITTER} from "./src/components/InAppNotification";
import EventEmitter from './src/service/events';
import { Colors, Images, Constants } from '@constants';
import Navigation from './src/service/navigation';
import {Linking} from "react-native";
import {REVIEW_URL} from "./src/urls";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.init();
  }

  init = async() => {
    messaging().onMessage(remoteMessage => {
      console.log(
          'Notification caused app to open from foreground state:',
          remoteMessage,
      );
      EventEmitter.emit(INAPP_NOTIFICATION_EMITTER, remoteMessage);
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log(
          'Notification caused app to open from background state:',
          remoteMessage.data,
      );
      if(Constants.user){
        const { action, uid, chateeId } = remoteMessage.data;

        switch (action){
          case 'review':
            if(uid && Constants.user.role === 'business'){
              setTimeout(() => Navigation.navigate("BusinessProfile", { screen: 'BusinessProfile' }, 1000));
            }
            break;
          case 'message':
            if(chateeId){
              setTimeout(() => Navigation.navigate("Message", { screen: 'Chat', params: { chateeId: chateeId }}, 1000));
            }
            break;
        }
      }
    });

    // Check whether an initial notification is available
    const remoteMessage = await messaging().getInitialNotification();

    if (remoteMessage) {
      console.log(
          'Notification caused app to open from quit state:',
          remoteMessage.data,
      );
      Constants.notification = (remoteMessage.data);
    }
  }


  render = () => {
    return (
      <>
        <Navigator />
        <InAppNotification/>
      </>
    );
  }
};
