import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useReducer, useState } from "react";
import cn from "classnames";
import cloneDeep from "lodash/cloneDeep";
import { useMouseState } from "../utils/useMouseState";

type Square = {
	isBlack: boolean;
	num: number | null;
	letter: string;
};

const initSquares: Square[] = [];
for (let i = 0; i < 225; i++) {
	const blankSquare: Square = { isBlack: false, num: null, letter: " " };
	initSquares.push(blankSquare);
}

type SquareReducerActionTypes =
	| { type: "toggleColor"; payload: { id: number } }
	| { type: "reset" };

const squareReducer = (state: Square[], action: SquareReducerActionTypes) => {
	switch (action.type) {
		case "toggleColor": {
			const newState = cloneDeep(state);

			const id = action.payload.id;

			newState[id]!.isBlack = !state[id]?.isBlack;

			if (id !== 112) {
				newState[224 - id]!.isBlack = !state[224 - id]?.isBlack;
			}

			return newState;
		}
		case "reset": {
			return initSquares;
		}
	}
};

const Editor: NextPage = () => {
	const [squares, setSquares] = useReducer(squareReducer, initSquares);
	const [editorMode, setEditorMode] = useState("Color");
	const [targetColor, setTargetColor] = useState(false);

	const { isMouseDown } = useMouseState();

	const handleMouseEvent = (id: number, click: boolean) => {
		if (editorMode === "Color") {
			const square = squares[id];

			if (click) setTargetColor(!square?.isBlack);

			const isOppColor = square?.isBlack !== targetColor;

			if (click || (isMouseDown && isOppColor)) {
				setSquares({ type: "toggleColor", payload: { id } });
				console.log("fired");
			}
		}
	};

	return (
		<>
			<Head>
				<title>Editor</title>
				<meta name="description" content="Edit crosswords" />
				{/* <link rel="icon" href="/favicon.ico" /> */}
			</Head>

			<main className="container mx-auto h-screen p-4">
				<h1 className="border border-black border-solid text-center">
					{isMouseDown ? <div>Mouse Down</div> : <div>Mouse Up</div>}
				</h1>
				<Board squares={squares} handleMouseEvent={handleMouseEvent}></Board>
				<Dashboard></Dashboard>
			</main>
		</>
	);
};

type BoardProps = {
	squares: Square[];
	handleMouseEvent: (id: number, click: boolean) => void;
};

const Board = ({ squares, handleMouseEvent }: BoardProps) => {
	const getSquareStyle = (i: number) => {
		return cn({
			"w-full h-full outline outline-1 outline-black font-bold": true,
			"bg-white": !squares[i]?.isBlack,
			"bg-black": squares[i]?.isBlack,
			// "bg-blue-300": i === selectedSquare,
			// "bg-blue-100": false,
		});
	};

	return (
		<div className="w-[450px] h-[450px] grid grid-cols-15">
			{squares.map((square, id) => {
				return (
					<div key={id}>
						<p className="absolute text-[10px] p-0 ml-[0.1rem]">{square.num}</p>
						<button
							className={getSquareStyle(id)}
							onMouseDown={() => handleMouseEvent(id, true)}
							onMouseOver={() => handleMouseEvent(id, false)}
						>
							{square.letter}
						</button>
					</div>
				);
			})}
		</div>
	);
};

const Dashboard = () => {
	return <></>;
};

export default Editor;
