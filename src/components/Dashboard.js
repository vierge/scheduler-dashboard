import React, { Component } from "react";
import Loading from "components/Loading";
import Panel from "components/Panel";
import classnames from "classnames";
import axios from "axios";

import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay,
} from "helpers/selectors";
import { setInterview } from "helpers/reducers";

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews,
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot,
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay,
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay,
  },
];

class Dashboard extends Component {
  state = {
    days: [],
    appointments: {},
    interviewers: {},
    loading: true,
    focused: null,
  };

  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));
    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers"),
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data,
      });
    });
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState((previousState) =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };

    if (focused) {
      this.setState({ focused });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  selectPanel(id) {
    this.setState((prevState) => ({
      focused: prevState.focused !== null ? null : id,
    }));
  }

  componentWillUnmount() {
    this.socket.close();
  }

  render() {
    console.log(this.state);
    const getPanels = data
      .filter(
        (panel) =>
          this.state.focused === null || this.state.focused === panel.id
      )
      .map((panel) => {
        return (
          <Panel
            key={panel.id}
            id={panel.id}
            label={panel.label}
            value={panel.getValue(this.state)}
            onSelect={() => this.selectPanel(panel.id)}
          />
        );
      });

    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused,
    });
    return this.state.loading ? (
      <Loading />
    ) : (
      <main className={dashboardClasses}>{getPanels}</main>
    );
  }
}

export default Dashboard;
