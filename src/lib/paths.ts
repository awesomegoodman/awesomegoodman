// The hosting base and the blog namespace are separate: the app stays at /.
export function pathTo(path = '') {
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function blogPath(path = '') {
  return pathTo(`blog/${path.replace(/^\//, '')}`);
}
