import { tasks as api } from "../../api";

// initial state
const state = {
  items: {
    total: 0,
    rows: []
  },
  processing: false
};

// getters
const getters = {};

// actions
const actions = {
  async getTasks({ commit }, options) {
    let response = await api.getTasks(options);
    commit("setTasks", response.data);
  },
  async createTask(context, { name, type }) {
    let response = await api.createTask(name, type);
    console.log(response);
  },
  processLoading({ commit }) {
    commit("processLoading");
  },
  canAddTask({ rootState }, { type, userId }) {
    return (
      type === "public" || (type === "private" && userId === rootState.userId)
    );
  },
  async cancelTask(context, id) {
    let response = await api.cancelTask(id);
    console.log(response);
  },
  async wsNotificationsInit({ rootState, state, dispatch, commit }) {
    const socket = new WebSocket(process.env.VUE_APP_WS_URL);

    socket.onopen = function() {
      console.log("onopen");
      if (rootState.user) {
        socket.send(
          JSON.stringify({
            type: "auth",
            token: rootState.user.access_token
          })
        );
      }
    };

    socket.onmessage = async function(event) {
      let data = JSON.parse(event.data);
      console.log("data:", data);

      switch (data.event) {
        case "Api\\Model\\Task\\Entity\\Task\\Event\\TaskCreated": {
          if (
            await dispatch("canAddTask", {
              type: data.type,
              userId: data.user_id
            })
          ) {
            commit("processLoading");
            await dispatch("getTasks");
            commit("processLoaded");
          }
          break;
        }
        case "Api\\Model\\Task\\Entity\\Task\\Event\\TaskExecuted":
        case "Api\\Model\\Task\\Entity\\Task\\Event\\TaskCompleted":
        case "Api\\Model\\Task\\Entity\\Task\\Event\\TaskCanceled":
        case "Api\\Model\\Task\\Entity\\Task\\Event\\TaskError": {
          commit("processLoading");
          await dispatch("getTasks");
          commit("processLoaded");
          break;
        }
        case "Api\\Model\\Task\\Entity\\Task\\Event\\TaskProcessed": {
          let hasTask = state.items.rows.some(item => item.id === data.task.id);
          if (hasTask) {
            commit("updateTask", data.task);
          } else {
            commit("processLoading");
            await dispatch("getTasks");
            commit("processLoaded");
          }
          break;
        }
      }
    };
  }
};

// mutations
const mutations = {
  setTasks(state, items) {
    state.items = items;
  },
  updateTask(state, task) {
    let item = state.items.rows.find(item => item.id === task.id);
    Object.assign(item, task);
  },
  processLoading(state) {
    state.processing = true;
  },
  processLoaded(state) {
    state.processing = false;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
