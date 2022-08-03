import { useEffect, useState } from "react";

export const useMouseState = () => {
	const [isMouseDown, setMouseDown] = useState(false);

	const setPrimaryButtonState = (e: MouseEvent) => {
		setMouseDown((e.buttons & 1) === 1);
	};

	useEffect(() => {
		window.addEventListener("mousedown", setPrimaryButtonState);
		window.addEventListener("mousemove", setPrimaryButtonState);
		window.addEventListener("mouseup", setPrimaryButtonState);
	}, []);

	return { isMouseDown };
};
