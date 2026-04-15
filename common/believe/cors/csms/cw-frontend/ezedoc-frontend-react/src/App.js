import React, { Component, Suspense } from 'react';
import {withRouter } from "react-router-dom";
import { connect } from "react-redux";

// import { getHost } from "containers/utils";
import {authCheckState} from "store/actions/signIn/Login";
import { orgLogoGet } from "store/actions/Orglogo/orglogo";
import * as constants from "./Data/constants";
// import routes from './urls';
// import datatype from "./Data/Createdata";
import MainRoutes from './router/index';
import Spinner from './components/UI/Spinner/Spinner';
import { saveToLocalStorage } from "./localStorage";
import Toast from './components/Toast';
import '../node_modules/bootstrap/dist/js/bootstrap';
import { withPlatformData } from './platformDataStoreContext';
import { QueryClient, QueryClientProvider } from 'react-query';
import { cleanProcessVariableCachedData } from './utils/tasks'
import { type } from 'ramda';
import { AUTH_CLEAR } from './store/actions/actionTypes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true disabling the refetch on focus 
    },
  },
});

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      loaded: false
    }
    this.loadComponent = this.loadComponent.bind(this);
  }

  componentDidMount() {
    // this.props.onTryAutoSignup(this.loadComponent);
    cleanProcessVariableCachedData();

    const { platformDispatch, platformActions, match } = this.props;
    platformDispatch(platformActions.getOrgDataById(match?.params?.uuid))

    try {
      if (localStorage.getItem) {
        const themeDataFromLocalStorage = JSON.parse(
          localStorage.getItem(constants.THEME_CONTROLLER)
        );
        if(themeDataFromLocalStorage !== null) {
          this.applyTheme(themeDataFromLocalStorage);
        }
      }
    } catch (exception) {
      // Failed to apply custom theme, applying default theme
    } finally {
      // this.props.onGetOrgLogo();
    }

    // HJID => Hotjar ID, HJSV => Hotjar Snippet Version
    // Disabled , since experiment is complete
    // if(process.env.REACT_APP_HJID !== '' && process.env.REACT_APP_HJSV !== '') {
    //   hotjar.initialize(process.env.REACT_APP_HJID, process.env.REACT_APP_HJSV);
    // }      
  }

  componentDidUpdate(prevProps) {
    const themeInfo = this.props.themeInfo;
    if (prevProps.themeInfo !== themeInfo) {
      saveToLocalStorage(this.props.themeInfo, constants.THEME_CONTROLLER);
      this.applyTheme(themeInfo);
    }

    const { platformData, match } = this.props;
    const { platformData: prevPlatformData } = prevProps;

    if(prevPlatformData?.auth?.user?.userId !== platformData?.auth?.user?.userId) {
      this.loadComponent();
    }
  }

  newVersionHandler = () => {
    const new_version_alert = document.getElementById('new_version_alert');
    const refresh = document.getElementById('refresh_btn');

      try{
        if (navigator.serviceWorker.controller !== null) {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
              new_version_alert.style.display = 'flex';
          });
        }
      } catch(e) {
        // eslint-disable-next-line no-console
        console.log(e)
      }
      refresh.addEventListener('click', () => {
        window.location.reload();
      });
  }

  applyTheme(setTheme) {
    if (setTheme.first_primary_color && setTheme.second_primary_color) {
      document.body.style.setProperty("--main-app-gradient-color", `linear-gradient(116deg, ${setTheme.first_primary_color}, ${setTheme.second_primary_color})`);
      document.body.style.setProperty("--main-first-primary-color", `${setTheme.first_primary_color}`);
      document.body.style.setProperty("--main-second-primary-color", `${setTheme.second_primary_color}`);
      document.body.style.setProperty("--main-first-button-color", `${setTheme.first_button_color}`);
      document.body.style.setProperty("--main-button-gradient-color", `linear-gradient(116deg, ${setTheme.first_button_color}, ${setTheme.second_button_color})`);
      document.body.style.setProperty("--main-button-text-color", `${setTheme.button_text_color === "WHITE" ? "#ffffff" : "#000000"}`);
    }
  }

  loadComponent() {
    this.setState({ loaded: true })
  }

  componentWillUnmount(){
    this.props.authClear();
  }

  render() {
    const { authUser, history } = this.props;
    if (!this.state.loaded) {
      return <Spinner />
    }
    // if (datatype.hostname === getHost()) {

    //   return (
    //     <Suspense fallback={<Spinner />}>
    //       <Route
    //         exact
    //         path={routes.REGISTER.path}
    //         component={routes.REGISTER.component} 
    //       />
    //       <Route
    //         exact
    //         path={routes.DIGILOCKER.path}
    //         render={props => <routes.DIGILOCKER.component {...props} />}
    //       />
    //     </Suspense>
    //   )
    // }
    return (
      <Suspense fallback={<Spinner />}>
        <Toast />
        <QueryClientProvider client={queryClient} >
          <MainRoutes user={authUser} history={history} />
        </QueryClientProvider>
      </Suspense>
    )
  }
}

const mapStateToProps = (state) => ({
  authUser: state.auth,
  themeInfo: state.orgLogo.theme
})

const mapDispatchToProps = (dispatch) =>  ({
  onTryAutoSignup: authCheckState,
  onGetOrgLogo: orgLogoGet,
  authClear: () => dispatch({ type: AUTH_CLEAR })
})

export default withPlatformData(withRouter(connect(mapStateToProps, mapDispatchToProps)(App)));
