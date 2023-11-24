export const message = (action, payload) => JSON.stringify([action, { ...payload }]);
