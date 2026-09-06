local ADDON_NAME = ...

local BUTTON_SIZE = 44
local DEFAULT_POINT = "LEFT"
local DEFAULT_REL_POINT = "LEFT"
local DEFAULT_X = 80
local DEFAULT_Y = 0

local db
local classId, specId, className, specName, specIcon
local button, iconTexture
local copyFrame, copyEdit, copyTitle

local function EnsureDB()
	if type(WowQuickRefDB) ~= "table" then
		WowQuickRefDB = {}
	end
	db = WowQuickRefDB
	if db.locked == nil then
		db.locked = false
	end
	if not db.point then
		db.point = DEFAULT_POINT
	end
	if not db.relativePoint then
		db.relativePoint = DEFAULT_REL_POINT
	end
	if db.x == nil then
		db.x = DEFAULT_X
	end
	if db.y == nil then
		db.y = DEFAULT_Y
	end
	if db.point == "RIGHT" and db.relativePoint == "RIGHT" and db.x == -80 and db.y == 0 then
		db.point = DEFAULT_POINT
		db.relativePoint = DEFAULT_REL_POINT
		db.x = DEFAULT_X
		db.y = DEFAULT_Y
	end
end

local function RefreshSpec()
	local localizedClass, _, id = UnitClass("player")
	className = localizedClass
	classId = id
	specId, specName, specIcon = nil, nil, nil

	local specIndex = C_SpecializationInfo.GetSpecialization()
	if specIndex and specIndex > 0 then
		specId, specName, _, specIcon = GetSpecializationInfo(specIndex)
	end

	if iconTexture then
		iconTexture:SetTexture(specIcon or "Interface\\Icons\\INV_Misc_Book_09")
	end
end

local function GetIPCString(action)
	return ("WQR|%d|%d|%s"):format(classId or 0, specId or 0, action or "open")
end

local function HideCopyFrame()
	if copyFrame then
		copyFrame:Hide()
	end
end

local function EnsureCopyFrame()
	if copyFrame then
		return
	end

	copyFrame = CreateFrame("Frame", "WowQuickRefCopy", UIParent)
	copyFrame:SetSize(268, 78)
	copyFrame:SetFrameStrata("DIALOG")
	copyFrame:SetClampedToScreen(true)
	copyFrame:EnableMouse(true)
	copyFrame:Hide()

	local bg = copyFrame:CreateTexture(nil, "BACKGROUND")
	bg:SetAllPoints()
	bg:SetColorTexture(0.08, 0.08, 0.1, 0.96)

	copyTitle = copyFrame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
	copyTitle:SetPoint("TOPLEFT", 8, -8)
	copyTitle:SetPoint("TOPRIGHT", -8, -8)
	copyTitle:SetJustifyH("LEFT")

	local hint = copyFrame:CreateFontString(nil, "OVERLAY", "GameFontHighlightSmall")
	hint:SetPoint("BOTTOMLEFT", 8, 8)
	hint:SetPoint("BOTTOMRIGHT", -8, 8)
	hint:SetJustifyH("LEFT")
	hint:SetText("Press Ctrl+C  (Esc to close)")

	copyEdit = CreateFrame("EditBox", nil, copyFrame)
	copyEdit:SetHeight(20)
	copyEdit:SetPoint("LEFT", 8, 2)
	copyEdit:SetPoint("RIGHT", -8, 2)
	copyEdit:SetFontObject(ChatFontNormal)
	copyEdit:SetAutoFocus(true)
	copyEdit:SetMaxLetters(80)
	copyEdit:SetScript("OnEscapePressed", HideCopyFrame)
	copyEdit:SetScript("OnEnterPressed", HideCopyFrame)
	copyEdit:SetScript("OnTextChanged", function(self)
		local wanted = self._wqr or ""
		if self:GetText() ~= wanted then
			self:SetText(wanted)
			self:HighlightText()
		end
	end)

	local hideQueued = false
	copyEdit:SetScript("OnKeyDown", function(_, key)
		if key == "C" and IsControlKeyDown() then
			hideQueued = true
		end
	end)
	copyEdit:SetScript("OnKeyUp", function(_, key)
		if hideQueued and (key == "C" or key == "LCTRL" or key == "RCTRL") then
			hideQueued = false
			HideCopyFrame()
		end
	end)
end

local function ShowCopyFrame(action)
	RefreshSpec()
	EnsureCopyFrame()
	local text = GetIPCString(action)
	copyEdit._wqr = text
	copyTitle:SetText(action == "rebind" and "Change overlay hotkey" or "Open overlay")
	copyEdit:SetText(text)
	copyFrame:ClearAllPoints()
	copyFrame:SetPoint("LEFT", button, "RIGHT", 8, 0)
	copyFrame:Show()
	copyEdit:SetFocus()
	copyEdit:HighlightText()
end

local function SavePosition()
	local point, _, relativePoint, x, y = button:GetPoint()
	db.point = point
	db.relativePoint = relativePoint
	db.x = x
	db.y = y
end

local function ApplyPosition()
	button:ClearAllPoints()
	button:SetPoint(db.point, UIParent, db.relativePoint, db.x, db.y)
end

local function ApplyLock()
	button:SetMovable(not db.locked)
end

local function ToggleLock()
	db.locked = not db.locked
	ApplyLock()
end

local function SpecLabel()
	if specName and className then
		return specName .. " " .. className
	end
	return className or "Unknown"
end

local function CreateButton()
	button = CreateFrame("Button", "WowQuickRefButton", UIParent)
	button:SetSize(BUTTON_SIZE, BUTTON_SIZE)
	button:SetFrameStrata("MEDIUM")
	button:SetClampedToScreen(true)
	button:EnableMouse(true)
	button:RegisterForClicks("LeftButtonUp", "RightButtonUp")
	button:RegisterForDrag("LeftButton")
	if button.SetDontSavePosition then
		button:SetDontSavePosition(true)
	end

	local bg = button:CreateTexture(nil, "BACKGROUND")
	bg:SetPoint("TOPLEFT", 1, -1)
	bg:SetPoint("BOTTOMRIGHT", -1, 1)
	bg:SetColorTexture(0.08, 0.08, 0.1, 0.95)

	iconTexture = button:CreateTexture(nil, "ARTWORK")
	iconTexture:SetPoint("TOPLEFT", 4, -4)
	iconTexture:SetPoint("BOTTOMRIGHT", -4, 4)
	iconTexture:SetTexCoord(0.08, 0.92, 0.08, 0.92)

	local mask = button:CreateMaskTexture()
	mask:SetAllPoints(iconTexture)
	mask:SetTexture("Interface\\CharacterFrame\\TempPortraitAlphaMask", "CLAMPTOBLACKADDITIVE", "CLAMPTOBLACKADDITIVE")
	bg:AddMaskTexture(mask)
	iconTexture:AddMaskTexture(mask)

	local border = button:CreateTexture(nil, "OVERLAY")
	border:SetPoint("CENTER")
	border:SetSize(BUTTON_SIZE + 14, BUTTON_SIZE + 14)
	border:SetTexture("Interface\\Minimap\\MiniMap-TrackingBorder")

	local highlight = button:CreateTexture(nil, "HIGHLIGHT")
	highlight:SetAllPoints(iconTexture)
	highlight:SetColorTexture(1, 1, 1, 0.18)
	highlight:AddMaskTexture(mask)

	button:SetScript("OnClick", function(_, mouseButton)
		if mouseButton == "RightButton" then
			ShowCopyFrame("rebind")
		else
			ShowCopyFrame("open")
		end
	end)

	button:SetScript("OnDragStart", function(self)
		if not db.locked then
			HideCopyFrame()
			self:StartMoving()
		end
	end)

	button:SetScript("OnDragStop", function(self)
		self:StopMovingOrSizing()
		SavePosition()
	end)

	button:SetScript("OnEnter", function(self)
		GameTooltip:SetOwner(self, "ANCHOR_RIGHT")
		GameTooltip:AddLine("WowQuickRef")
		GameTooltip:AddLine(SpecLabel(), 1, 1, 1)
		GameTooltip:AddLine("Left-click: open overlay (Ctrl+C)", 0.75, 0.75, 0.75)
		GameTooltip:AddLine("Right-click: change hotkey", 0.75, 0.75, 0.75)
		GameTooltip:AddLine(db.locked and "Locked" or "Unlocked — drag to move", 0.75, 0.75, 0.75)
		GameTooltip:Show()
	end)

	button:SetScript("OnLeave", function()
		GameTooltip:Hide()
	end)

	ApplyPosition()
	ApplyLock()
	RefreshSpec()
end

SLASH_WQR1 = "/wqr"
SlashCmdList.WQR = function(msg)
	msg = strtrim(msg or ""):lower()
	if msg == "lock" then
		ToggleLock()
		return
	end
	if msg == "hotkey" then
		ShowCopyFrame("rebind")
		return
	end
	ShowCopyFrame("open")
end

local events = CreateFrame("Frame")
events:RegisterEvent("ADDON_LOADED")
events:RegisterEvent("PLAYER_LOGIN")
events:RegisterEvent("PLAYER_ENTERING_WORLD")
events:RegisterEvent("PLAYER_SPECIALIZATION_CHANGED")
events:SetScript("OnEvent", function(_, event, arg1)
	if event == "ADDON_LOADED" then
		if arg1 ~= ADDON_NAME then
			return
		end
		EnsureDB()
		CreateButton()
		events:UnregisterEvent("ADDON_LOADED")
	elseif event == "PLAYER_SPECIALIZATION_CHANGED" then
		if arg1 == "player" then
			RefreshSpec()
		end
	else
		RefreshSpec()
	end
end)
