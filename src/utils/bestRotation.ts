import { Location, PossibleRotation } from "../types.js"

export const getBestRotation = (locTarget: Location, locPlayer: Location, finalRotations: PossibleRotation[]): PossibleRotation => {
    let angleDeg = Math.abs(Math.atan2(locTarget.y - locPlayer.y, locTarget.x - locPlayer.x) * (180 / Math.PI) + 90)

    const bestRotation = finalRotations.reduce(function(prev, curr) {
        return (Math.abs(curr.rotation - angleDeg) < Math.abs(prev.rotation - angleDeg) ? curr : prev)
    });

    return bestRotation
} 
