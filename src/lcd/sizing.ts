/** A logical cell always occupies a square number of physical display pixels. */
export function fitGrid(
  width: number,
  height: number,
  availableWidth: number,
  availableHeight: number,
  dpr = 1,
  integer = true,
) {
  const fit = Math.max(
    0.01,
    Math.min(availableWidth / width, availableHeight / height),
  );
  const unit = integer ? Math.max(1, Math.floor(fit * dpr)) / dpr : fit;
  return { width: width * unit, height: height * unit, unit };
}
